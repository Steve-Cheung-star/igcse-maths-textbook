import { map } from 'nanostores';

export const projectorStore = map({
  isBento: false,
  isToolbarMinimized: false,
  tool: 'laser', // 'mouse', 'laser', 'pen', 'eraser'
  colorName: 'cyan',
  colorValue: 'rgba(0, 255, 255, 0.75)'
});

export const toolsConfig = {
  colors: {
    cyan: 'rgba(0, 255, 255, 0.75)',
    magenta: 'rgba(255, 0, 255, 0.75)',
    yellow: 'rgba(255, 255, 0, 0.75)',
    lime: 'rgba(57, 255, 20, 0.75)',
    white: 'rgba(255, 255, 255, 0.8)'
  }
};