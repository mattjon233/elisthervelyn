import { Plane } from '@react-three/drei';

const HealthBar = ({ health, maxHealth }) => {
  const healthPercentage = health / maxHealth;

  return (
    <group position={[0, 2, 0]}>
      <Plane args={[1, 0.2]} position={[0, 0, -0.01]}>
        <meshBasicMaterial color="red" />
      </Plane>
      <Plane args={[healthPercentage, 0.2]} position={[- (1 - healthPercentage) / 2, 0, 0]}>
        <meshBasicMaterial color="green" />
      </Plane>
    </group>
  );
};

export default HealthBar;
