import { HabitatPlay, type HabitatPlayProps } from '../components/habitat/HabitatPlay';

export function BugGardenScreen(props: HabitatPlayProps) {
  return <HabitatPlay {...props} kind="garden" />;
}
