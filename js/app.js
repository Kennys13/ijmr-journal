document.addEventListener("DOMContentLoaded", () => {
    
    // --- SCROLL REVEAL ANIMATION ---
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
    revealOnScroll(); // Trigger once on load to show initial elements

    // --- INFINITE CAROUSEL LOGIC ---
    const track = document.getElementById("carouselTrack");
    
    if (track) {
        // Clone items for seamless loop (double the items)
        const items = Array.from(track.children);
        items.forEach(item => {
            const clone = item.cloneNode(true);
            track.appendChild(clone);
        });

        let scrollAmount = 0;
        const speed = 0.5; // Adjust speed of auto-scroll
        let animationId;

        function animateCarousel() {
            scrollAmount += speed;
            // Reset when first set is fully scrolled out
            if (scrollAmount >= track.scrollWidth / 2) {
                scrollAmount = 0;
            }
            track.style.transform = `translateX(-${scrollAmount}px)`;
            animationId = requestAnimationFrame(animateCarousel);
        }
        
        // Start Animation
        animationId = requestAnimationFrame(animateCarousel);
        
        // Pause on Hover
        track.addEventListener("mouseenter", () => cancelAnimationFrame(animationId));
        track.addEventListener("mouseleave", () => {
            animationId = requestAnimationFrame(animateCarousel);
        });
    }

    // --- CURRENT YEAR IN FOOTER ---
    const yearSpan = document.getElementById('year');
    if(yearSpan) {
        yearSpan.innerText = new Date().getFullYear();
    }
});