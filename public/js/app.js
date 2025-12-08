document.addEventListener("DOMContentLoaded", () => {
    
    // Scroll Reveal
    const revealElements = document.querySelectorAll(".reveal");
    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        const elementVisible = 100;
        revealElements.forEach((reveal) => {
            const elementTop = reveal.getBoundingClientRect().top;
            if (elementTop < windowHeight - elementVisible) {
                reveal.classList.add("active");
            }
        });
    };
    window.addEventListener("scroll", revealOnScroll);
    revealOnScroll();

    // Infinite Carousel
    const track = document.getElementById("carouselTrack");
    if (track) {
        const items = Array.from(track.children);
        items.forEach(item => {
            const clone = item.cloneNode(true);
            track.appendChild(clone);
        });

        let scrollAmount = 0;
        const speed = 0.5;
        let animationId;

        function animateCarousel() {
            scrollAmount += speed;
            if (scrollAmount >= track.scrollWidth / 2) {
                scrollAmount = 0;
            }
            track.style.transform = `translateX(-${scrollAmount}px)`;
            animationId = requestAnimationFrame(animateCarousel);
        }
        
        animationId = requestAnimationFrame(animateCarousel);
        track.addEventListener("mouseenter", () => cancelAnimationFrame(animationId));
        track.addEventListener("mouseleave", () => animationId = requestAnimationFrame(animateCarousel));
    }

    // Dynamic Year
    const yearSpan = document.getElementById('year');
    if(yearSpan) yearSpan.innerText = new Date().getFullYear();
});