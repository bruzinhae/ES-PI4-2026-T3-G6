/**
 * servicos/correio.js — ENVIO DE E-MAIL (link de redefinição de senha).
 *
 * Usa SMTP (nodemailer). As credenciais ficam no .env (SMTP_HOST, SMTP_USER, SMTP_PASS),
 * nunca no código. Quem chama é o authService, só quando o e-mail já existe na base.
 */

import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { ErroApi } from '../utils/ErroApi.js';

const MENSAGEM_FALHA_ENVIO = 'Não foi possível enviar o e-mail de recuperação. Tente novamente em instantes.';

let transporte;

// Há conta de envio de verdade? Host, usuário e senha precisam estar preenchidos.
export function correioConfigurado() {
    return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
}

function obterTransporte() {
    if (!transporte) {
        transporte = nodemailer.createTransport({
            host: env.smtp.host,
            port: env.smtp.port,
            secure: env.smtp.secure,
            auth: {
                user: env.smtp.user,
                pass: env.smtp.pass,
            },
        });
    }

    return transporte;
}

// Confere a conexão SMTP na subida do servidor. Não derruba a API se falhar:
// o restante (login, cadastro...) continua; só a recuperação fica sem envio.
export async function verificarCorreio() {
    if (!correioConfigurado()) {
        return {
            ok: false,
            motivo: 'preencha SMTP_HOST, SMTP_USER e SMTP_PASS no backend/.env',
        };
    }

    try {
        await obterTransporte().verify();
        return { ok: true };
    } catch (erro) {
        return { ok: false, motivo: erro.message };
    }
}

function escaparHtml(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * HTML do e-mail de recuperação. Layout em tabelas + CSS inline: é o que Gmail, Outlook
 * e Apple Mail aceitam de forma estável. Cores seguem a tela de login (#4f3466).
 */
function montarHtmlRecuperacao({ saudacao, link }) {
    const saudacaoHtml = escaparHtml(saudacao);
    const linkHtml = escaparHtml(link);

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir senha — AçaíStudy</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">

          <tr>
            <td style="background-color:#4f3466;background:linear-gradient(135deg,#4f3466 0%,#3e2852 100%);padding:28px 32px;text-align:center;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:700;letter-spacing:0.2px;color:#ffffff;">
                Açaí<span style="color:#c4b5d4;">Study</span>
              </p>
              <p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#d8cce3;">
                Sua organização nos estudos
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 32px 8px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 20px;">
                <tr>
                  <td style="width:56px;height:56px;border-radius:28px;background-color:rgba(79,52,102,0.10);text-align:center;vertical-align:middle;font-size:26px;line-height:56px;">
                    🔑
                  </td>
                </tr>
              </table>
              <h1 style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.3;font-weight:700;color:#14111f;">
                Redefinir sua senha
              </h1>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#475569;text-align:left;">
                ${saudacaoHtml}. Recebemos um pedido para criar uma nova senha na sua conta do AçaíStudy.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                <tr>
                  <td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#475569;">
                    <strong style="color:#4f3466;">Este link é só seu.</strong>
                    Vale por <strong>30 minutos</strong> e só pode ser usado <strong>uma vez</strong>.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px 8px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td align="center" bgcolor="#4f3466" style="border-radius:10px;background-color:#4f3466;">
                    <a href="${linkHtml}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">
                      Criar nova senha
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px 8px;">
              <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#64748b;">
                Se o botão não funcionar, copie e cole este endereço no navegador:
              </p>
              <p style="margin:0;padding:12px 14px;font-family:Consolas,Monaco,monospace;font-size:11px;line-height:1.5;color:#4f3466;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;word-break:break-all;">
                ${linkHtml}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #f1f5f9;">
                <tr>
                  <td style="padding-top:20px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.55;color:#64748b;">
                    Se você <strong>não pediu</strong> essa redefinição, ignore este e-mail. Sua senha continua a mesma e ninguém consegue usá-la sem o link.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color:#f8fafc;padding:18px 32px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#94a3b8;">
                © ${new Date().getFullYear()} AçaíStudy · Feito para a sua organização acadêmica
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Manda o link único da tela de nova senha. O link já vem pronto (com o token).
 * Falha de SMTP vira ErroApi 503 com uma mensagem genérica — o detalhe fica no log.
 */
export async function enviarLinkRecuperacaoSenha({ destinatario, nome, link }) {
    if (!correioConfigurado()) {
        throw new ErroApi(503, MENSAGEM_FALHA_ENVIO);
    }

    const primeiroNome = String(nome ?? '').trim().split(/\s+/)[0];
    const saudacao = primeiroNome ? `Olá, ${primeiroNome}` : 'Olá';

    const texto = [
        `${saudacao}.`,
        '',
        'Recebemos um pedido para redefinir a senha da sua conta no AçaíStudy.',
        'Este link é só seu, vale por 30 minutos e só pode ser usado uma vez:',
        '',
        link,
        '',
        'Se você não pediu isso, ignore este e-mail. Sua senha continua a mesma.',
        '',
        'AçaíStudy',
    ].join('\n');

    try {
        await obterTransporte().sendMail({
            from: env.smtp.from,
            to: destinatario,
            subject: 'Redefina sua senha do AçaíStudy',
            text: texto,
            html: montarHtmlRecuperacao({ saudacao, link }),
        });
    } catch (erro) {
        console.error('[recuperação de senha] falha ao enviar e-mail:', erro.message);
        throw new ErroApi(503, MENSAGEM_FALHA_ENVIO);
    }
}
