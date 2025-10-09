import './ShopUI.css';
import { useShopStore } from '../store/shopStore';
import { useMissionStore } from '../store/missionStore';

function ShopUI() {
  const { isShopOpen, closeShop, upgrades, buyUpgrade, hasUsedFreeUpgrade } = useShopStore();
  const { teamGold, spendGold } = useMissionStore();

  if (!isShopOpen) {
    return null;
  }

  const upgradeCost = hasUsedFreeUpgrade ? 50 : 0;

  const handleBuy = (upgradeId) => {
    if (upgrades[upgradeId]) return; // Already bought

    if (teamGold >= upgradeCost) {
      if (upgradeCost > 0) {
        spendGold(upgradeCost);
      }
      buyUpgrade(upgradeId);
    } else {
      alert('Ouro insuficiente!');
    }
  };

  return (
    <div className="shop-ui-overlay">
      <div className="shop-ui-modal">
        <button className="close-button" onClick={closeShop}>X</button>
        <h2>Olá! Eu sou o Tio Uncle.</h2>
        <p>Estou oferecendo uma melhoria grátis pra vocês, escolha uma das melhorias pro pet de vocês!</p>
        
        <div className="upgrades-container">
          <div className={`upgrade-card ${upgrades.healCooldown ? 'bought' : ''}`}>
            <h3>Velocidade de Cura</h3>
            <p>Rocket cura a cada 10 segundos.</p>
            <button onClick={() => handleBuy('healCooldown')} disabled={upgrades.healCooldown}>
              {upgrades.healCooldown ? 'Comprado' : `Comprar (${upgradeCost} Ouro)`}
            </button>
          </div>
          <div className={`upgrade-card ${upgrades.healAmount ? 'bought' : ''}`}>
            <h3>Potência da Cura</h3>
            <p>Rocket cura 10HP.</p>
            <button onClick={() => handleBuy('healAmount')} disabled={upgrades.healAmount}>
              {upgrades.healAmount ? 'Comprado' : `Comprar (${upgradeCost} Ouro)`}
            </button>
          </div>
          <div className={`upgrade-card ${upgrades.rocketSpeed ? 'bought' : ''}`}>
            <h3>Velocidade do Pet</h3>
            <p>Rocket anda 2x mais rápido.</p>
            <button onClick={() => handleBuy('rocketSpeed')} disabled={upgrades.rocketSpeed}>
              {upgrades.rocketSpeed ? 'Comprado' : `Comprar (${upgradeCost} Ouro)`}
            </button>
          </div>
        </div>
        <p className="gold-info">Seu time tem: {teamGold} Ouro</p>
      </div>
    </div>
  );
}

export default ShopUI;
