/**
 * Homepage — revelação suave das seções ao rolar.
 */

(function () {
    const itens = document.querySelectorAll('.lista-recursos li');

    if (!('IntersectionObserver' in window) || !itens.length) {
        itens.forEach((item) => item.classList.add('visivel'));
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entrada) => {
                if (!entrada.isIntersecting) {
                    return;
                }

                const alvo = entrada.target;
                const delay = Number(alvo.dataset.delay || 0);

                window.setTimeout(() => {
                    alvo.classList.add('visivel');
                }, delay);

                observer.unobserve(alvo);
            });
        },
        { threshold: 0.2 }
    );

    itens.forEach((item, index) => {
        item.dataset.delay = String(index * 90);
        observer.observe(item);
    });
})();
