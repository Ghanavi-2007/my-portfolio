document.addEventListener("DOMContentLoaded", () => {
    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const iconSpan = themeToggle.querySelector('.icon');

    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'light' || (!savedTheme && !prefersDark)) {
        htmlElement.setAttribute('data-theme', 'light');
        iconSpan.textContent = '🌙';
    } else {
        htmlElement.setAttribute('data-theme', 'dark');
        iconSpan.textContent = '🔆';
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        let newTheme = 'dark';
        
        if (currentTheme === 'dark') {
            newTheme = 'light';
            iconSpan.textContent = '🌙';
        } else {
            iconSpan.textContent = '🔆';
        }

        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Determine if there's a staggered delay
                const delay = entry.target.style.getPropertyValue('--delay') || '0s';
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, parseFloat(delay) * 1000);
                
                // Optional: Stop observing once visible if you only want it to animate once
                // observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.fade-in-up');
    animatedElements.forEach(el => observer.observe(el));

    // Form submission with Backend Connection
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            
            // Get form data
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                message: document.getElementById('message').value
            };

            // API URL Configuration (Relative path works for both local and Render!)
            const API_URL = '/api/contact';

            btn.textContent = 'Sending...';
            btn.disabled = true;

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    btn.textContent = 'Message Sent Successfully!';
                    btn.style.background = '#10b981'; // Success Green
                    contactForm.reset();
                    setTimeout(() => {
                        btn.textContent = 'Send Message';
                        btn.style.background = '';
                        btn.disabled = false;
                    }, 3000);
                } else {
                    const errorDetails = await response.json();
                    console.error('SERVER ERROR DETAILS:', errorDetails); // DEBUG LOG
                    throw new Error('Server returned an error');
                }
            } catch (err) {
                console.error('FRONTEND FETCH ERROR:', err); // DEBUG LOG
                btn.textContent = 'Error! Try again.';
                btn.style.background = '#ef4444'; // Red accent
            } finally {
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.disabled = false;
                    btn.style.background = ''; // Revert to original
                }, 4000);
            }
        });
    }
});
