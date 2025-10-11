import { useState, useEffect, useMemo } from 'react';
import './IntroCinematic.css';

/**
 * Cinematográfica de introdução do jogo aprimorada, com animações e ícones visuais.
 * Conta a história de Eldoria, as três irmãs, a invasão sombria e a profecia do Oráculo.
 */
function IntroCinematic({ onComplete }) {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const scenes = useMemo(() => [
    {
      id: 1,
      text: "No reino mágico de Eldoria, três irmãs viviam em paz...",
      icons: ["🏰"],
      duration: 6000,
    },
    {
      id: 2,
      text: "Esther, a arqueira, Elissa, a guerreira, e Evelyn, a maga.",
      icons: ["🏹", "⚔️", "✨"],
      duration: 7000,
    },
    {
      id: 3,
      text: "Mas um dia, uma força sombria invadiu o reino...",
      icons: ["☁️"],
      duration: 6000,
    },
    {
      id: 4,
      text: "Uma horda de zumbis e fantasmas ameaçava destruir tudo!",
      icons: ["🧟", "👻", "🧟‍♀️"],
      duration: 6000,
    },
    {
      id: 5,
      text: "O Oráculo, guardião ancestral, revelou uma profecia...",
      icons: ["🔮"],
      duration: 7000,
    },
    {
      id: 6,
      text: '"Apenas três heroínas e um cachorro leal poderão salvar o mundo!"',
      icons: ["🔮"],
      duration: 7000,
    },
    {
      id: 7,
      text: "As três irmãs, junto com Rocket, seu fiel companheiro...",
      icons: ["👧", "👧", "👧", "🐕"],
      duration: 6000,
    },
    {
      id: 8,
      text: "Aceitaram o chamado para proteger Eldoria!",
      icons: ["⚡"],
      duration: 6000,
    },
  ], []);

  useEffect(() => {
    if (isSkipping) {
      onComplete();
      return;
    }
    if (currentSceneIndex >= scenes.length) {
      onComplete();
      return;
    }

    const currentScene = scenes[currentSceneIndex];
    let sceneTimer, transitionTimer;

    sceneTimer = setTimeout(() => {
      setIsFadingOut(true);
      transitionTimer = setTimeout(() => {
        setCurrentSceneIndex(prev => prev + 1);
        setIsFadingOut(false); // Reset for the new scene
      }, 1000); // Fade out duration
    }, currentScene.duration - 1000);

    return () => {
      clearTimeout(sceneTimer);
      clearTimeout(transitionTimer);
    };
  }, [currentSceneIndex, onComplete, scenes, isSkipping]);

  const handleSkip = () => {
    setIsSkipping(true);
  };
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  const scene = scenes[currentSceneIndex];
  if (!scene) {
    return null;
  }

  return (
    <div
      className={`intro-cinematic scene-${scene.id} ${isFadingOut ? 'fade-out' : 'fade-in'}`}
      key={currentSceneIndex}
    >
      <div className="scene-background" />
      <div className="vignette" />
      
      <div className="scene-content">
        <div className="icons-container">
          {scene.icons.map((icon, index) => (
            <div
              key={index}
              className="scene-icon"
              style={{ animationDelay: `${index * 0.3}s` }}
            >
              {icon}
            </div>
          ))}
        </div>
        <p className="scene-text">{scene.text}</p>
      </div>

      <button className="skip-button" onClick={handleSkip}>
        Pular (ESC)
      </button>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ animationDuration: `${scene.duration}ms` }}
        />
      </div>
    </div>
  );
}

export default IntroCinematic;
