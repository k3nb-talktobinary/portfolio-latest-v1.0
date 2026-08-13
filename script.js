const header = document.querySelector('.site-header');
const navLinks = document.querySelectorAll('.nav-links a');
const menu = document.getElementById('navLinks');
const menuBtn = document.getElementById('menuBtn');
const toTop = document.getElementById('toTop');

function updateChrome() {
  const scrolled = window.scrollY > 18;
  header.classList.toggle('scrolled', scrolled);
  toTop.classList.toggle('visible', window.scrollY > 650);
}

window.addEventListener('scroll', updateChrome, { passive: true });
updateChrome();

menuBtn.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  menuBtn.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});

navLinks.forEach(link => link.addEventListener('click', () => {
  menu.classList.remove('open');
  menuBtn.classList.remove('open');
  menuBtn.setAttribute('aria-expanded', 'false');
}));

document.addEventListener('click', event => {
  if (!menu.contains(event.target) && !menuBtn.contains(event.target)) {
    menu.classList.remove('open');
    menuBtn.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

const sections = [...document.querySelectorAll('main section[id]')];
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;
    navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));
  });
}, { rootMargin: '-35% 0px -58% 0px', threshold: 0 });
sections.forEach(section => sectionObserver.observe(section));

const filterButtons = document.querySelectorAll('.filter');
const projects = document.querySelectorAll('.project-card');
filterButtons.forEach(button => button.addEventListener('click', () => {
  filterButtons.forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  const value = button.dataset.filter;
  projects.forEach(project => {
    const shouldShow = value === 'all' || project.dataset.category === value;
    project.classList.toggle('hidden', !shouldShow);
  });
}));

toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
document.getElementById('year').textContent = new Date().getFullYear();
