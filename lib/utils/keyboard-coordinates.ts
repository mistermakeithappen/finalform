import {
  KeyboardCoordinateGetter,
  KeyboardCode,
} from '@dnd-kit/core';

// Custom keyboard coordinate getter that ignores space key when in input fields
export const customSortableKeyboardCoordinates: KeyboardCoordinateGetter = (
  event,
  { currentCoordinates }
) => {
  // Check if the event target is an input or textarea
  const target = event.target as HTMLElement;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
    // Don't handle keyboard events when typing in inputs
    return;
  }

  // Allow space key to work normally in inputs by not handling it for sorting
  if (event.code === KeyboardCode.Space) {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      return;
    }
  }

  const { code } = event;

  if (!currentCoordinates) {
    return;
  }

  switch (code) {
    case KeyboardCode.Down:
      return {
        ...currentCoordinates,
        y: currentCoordinates.y + 25,
      };
    case KeyboardCode.Up:
      return {
        ...currentCoordinates,
        y: currentCoordinates.y - 25,
      };
    case KeyboardCode.Right:
      return {
        ...currentCoordinates,
        x: currentCoordinates.x + 25,
      };
    case KeyboardCode.Left:
      return {
        ...currentCoordinates,
        x: currentCoordinates.x - 25,
      };
  }

  return undefined;
};