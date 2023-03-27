import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { FC, ReactNode, forwardRef, useRef, useState } from 'react';
import { CSSTransition } from 'react-transition-group';

interface ContextMenuProps {
  x: number;
  y: number;
  onMenuItemSelected?: (nodeType: string) => void;
}

const menuStyles = css`
  position: absolute;
  background-color: #1e1e1e;
  border: 2px solid #444;
  border-radius: 4px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
  font-family: 'Roboto Mono', monospace;
  color: #fff;
  font-size: 14px;
  padding: 8px;
  z-index: 1;
  min-width: 150px;

  &:after {
    content: '';
    position: absolute;
    top: -8px;
    left: 5px;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 8px 8px 8px;
    border-color: transparent transparent #444 transparent;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
`;

const submenuStyles = css`
  position: absolute;
  top: 2px;
  left: 90%;
  margin-left: 4px;
  margin-top: -4px;
  min-width: 150px;
  border: 2px solid #444;
  border-left: none;
  border-radius: 4px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
  background-color: #1e1e1e;
  color: #fff;
  z-index: 1;
  padding: 8px;

  &.submenu-enter {
    opacity: 0;
  }

  &.submenu-enter-active {
    opacity: 1;
    transition: opacity 100ms ease-out;
  }

  &.submenu-exit {
    opacity: 1;
  }

  &.submenu-exit-active {
    opacity: 0;
    transition: opacity 100ms ease-out;
  }
`;

const MenuItemDiv = styled.div<{ hasSubmenu?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  margin: 4px 0;
  border-radius: 4px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  transition: background-color 0.1s ease-out, color 0.1s ease-out;

  &:hover {
    background-color: #4444446e;
    color: #ffa500;
  }

  ${(props) =>
    props.hasSubmenu &&
    css`
      &::after {
        content: '';
        position: absolute;
        right: 14px;
        top: 50%;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 7px 0 7px 7px;
        border-color: transparent transparent transparent #444;
      }
    `}
`;

interface MenuItemProps {
  label: string;
  onClick?: () => void;
  hasSubMenu?: boolean;
  children?: ReactNode;
}

const MenuItem: FC<MenuItemProps> = ({ label, onClick, children }) => {
  const submenuRef = useRef<HTMLDivElement>(null);
  const [isSubMenuVisible, setIsSubMenuVisible] = useState(false);
  const hasSubMenu = !!children;

  const handleMouseEnter = () => {
    if (hasSubMenu) {
      setIsSubMenuVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (hasSubMenu) {
      setIsSubMenuVisible(false);
    }
  };

  return (
    <MenuItemDiv
      hasSubmenu={hasSubMenu}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {label}
      <CSSTransition nodeRef={submenuRef} in={isSubMenuVisible} timeout={100} classNames="submenu" unmountOnExit>
        <div ref={submenuRef} css={submenuStyles}>
          {children}
        </div>
      </CSSTransition>
    </MenuItemDiv>
  );
};

export const ContextMenu = forwardRef<HTMLDivElement, ContextMenuProps>(({ x, y, onMenuItemSelected }, ref) => {
  return (
    <div ref={ref} css={menuStyles} style={{ top: y + 4, left: x - 16 }} onClick={(e) => e.stopPropagation()}>
      <MenuItem label="Add" hasSubMenu={true}>
        <MenuItem label="Chat" onClick={() => onMenuItemSelected?.('Add:ChatNode')} />
        <MenuItem label="User Input" onClick={() => onMenuItemSelected?.('Add:UserInputNode')} />
      </MenuItem>
    </div>
  );
});
