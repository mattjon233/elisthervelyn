import './Credits.css';

function Credits() {
  const roles = [
    { role: 'Roteirista', name: 'Matthews Jones' },
    { role: 'Diretor', name: 'Matthews Jones' },
    { role: 'Desenvolvedor Principal', name: 'Matthews Jones' },
    { role: 'Designer de Jogo', name: 'Matthews Jones' },
    { role: 'Artista 3D', name: 'Matthews Jones' },
    { role: 'Animador', name: 'Matthews Jones' },
    { role: 'Designer de Som', name: 'Matthews Jones' },
    { role: 'Compositor da Trilha Sonora', name: 'Matthews Jones' },
    { role: 'Testador de Qualidade', name: 'Matthews Jones' },
    { role: 'Gerente de Projeto', name: 'Matthews Jones' },
  ];

  return (
    <div className="credits-overlay">
      <div className="credits-scroll">
        <h1>O Oráculo</h1>
        <br />
        <br />
        {roles.map(({ role, name }, index) => (
          <div key={index} className="credit-item">
            <h2>{role}</h2>
            <p>{name}</p>
          </div>
        ))}
        <br />
        <br />
        <div className="credit-item">
            <h2>Agradecimentos Especiais</h2>
            <p>Você</p>
        </div>
        <br />
        <br />
        <h2>FIM</h2>
      </div>
    </div>
  );
}

export default Credits;
