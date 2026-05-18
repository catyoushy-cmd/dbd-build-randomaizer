export function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--line-1)',
        padding: '18px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <p
        className="label-mono"
        style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '.2em' }}
      >
        DBD Randomizer · фан-проект, не аффилирован с BHVR
      </p>
    </footer>
  );
}
