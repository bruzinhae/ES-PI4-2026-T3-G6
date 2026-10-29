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
    return blocos.reduce((soma, bloco) => (
        soma + (Number(bloco.duracaoMinutos) || 0) * (bloco.diasSemana?.length || 0)
    ), 0);
}
