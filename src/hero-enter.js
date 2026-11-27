/* Hero entrance: dot breathing, heading reveal */
document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes dot-breathe {
      0% { opacity: 0; transform: scale(0); }
      50% { opacity: 1; transform: scale(1.06); }
      100% { opacity: 1; transform: scale(1); }
    }
    @keyframes text-rise {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .hero h1 { opacity: 1 !important; animation: text-rise 1.4s cubic-bezier(0.16, 1, 0.3, 1) 2.4s both; }
    .dot b { animation: dot-breathe 2.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
  `;
  document.head.appendChild(style);
});
