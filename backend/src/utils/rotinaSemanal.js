/**
 * A mesma conta da rotina semanal: horas dos blocos fixos sobre a meta de horas da conta.
 * A barra usa no máximo 100; o percentual em texto pode passar disso.
 */

export function resumoRotina(minutos, metaHoras) {
    const horas = Math.round(((Number(minutos) || 0) / 60) * 10) / 10;
    const meta = Number(metaHoras);
    const metaValida = Number.isFinite(meta) && meta > 0 ? meta : null;
    const percentual = metaValida ? Math.round((horas / metaValida) * 100) : null;

    return {
        horas,
        metaHoras: metaValida,
        percentual,
    };
}

export function minutosDaSemana(blocos = []) {
    const intervalo = { semanal: 1, quinzenal: 2, a_cada_3_semanas: 3 };
    return blocos.reduce((soma, bloco) => (
        soma + (Number(bloco.duracaoMinutos) || 0) * (bloco.diasSemana?.length || 0) / (intervalo[bloco.recorrencia] || 1)
    ), 0);
}
