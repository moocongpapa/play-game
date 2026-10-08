import type { CharacterId } from '../types';

/** Shared toy-box palette for full-body friends and close-up care portraits. */
export const CHARACTER_ART: Record<CharacterId, {
  light: string; fur: string; shade: string; edge: string;
  cream: string; accent: string; accentShade: string; ink: string;
}> = {
  ggomi: { light: '#FBE2BF', fur: '#DAAA84', shade: '#B97F62', edge: '#A36F58', cream: '#FFF0D6', accent: '#EEABC0', accentShade: '#CD7895', ink: '#654139' },
  rano: { light: '#D6F0AA', fur: '#8AC9A2', shade: '#54A18B', edge: '#4C8B77', cream: '#FFF2B9', accent: '#F7D47F', accentShade: '#D7A752', ink: '#345E50' },
  jelly: { light: '#FFFFFF', fur: '#F3E9F7', shade: '#D0B8E0', edge: '#B496C8', cream: '#FFF9F1', accent: '#C8B0EA', accentShade: '#A485CD', ink: '#654979' },
  dochi: { light: '#FFE6B9', fur: '#EFBD87', shade: '#D99765', edge: '#B47A53', cream: '#FFF0D2', accent: '#A6CCBC', accentShade: '#729D8D', ink: '#624638' },
  ggulgguli: { light: '#FFEAE1', fur: '#F5B6C2', shade: '#DB8CA2', edge: '#BE7C90', cream: '#FFF2DA', accent: '#F3CF8C', accentShade: '#D3A15E', ink: '#78505C' },
  eumme: { light: '#FFFFFF', fur: '#F7F2E7', shade: '#D4D5C6', edge: '#B5B9AB', cream: '#FFEBD3', accent: '#ACD5E3', accentShade: '#78A8BF', ink: '#62605B' },
  nurungji: { light: '#FFE9AD', fur: '#EFC17C', shade: '#CB925A', edge: '#AF7849', cream: '#FFF6DD', accent: '#A9C6A0', accentShade: '#7FA07A', ink: '#624433' },
  pingu: { light: '#92B9CD', fur: '#5F819C', shade: '#3D5D79', edge: '#38536D', cream: '#FFF9E8', accent: '#A5DECC', accentShade: '#66B6A6', ink: '#354F66' },
};
