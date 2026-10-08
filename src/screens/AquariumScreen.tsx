import { HabitatPlay, type HabitatPlayProps } from '../components/habitat/HabitatPlay';

export function AquariumScreen(props: HabitatPlayProps) {
  return <HabitatPlay {...props} kind="aquarium" />;
}
