export default function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){var t=localStorage.getItem('meetiiit_theme');if(t==='dark')document.documentElement.classList.add('theme-dark');else if(t==='light')document.documentElement.classList.add('theme-light');})();`,
      }}
    />
  );
}
