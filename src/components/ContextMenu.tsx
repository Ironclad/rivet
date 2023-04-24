import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { FC, ReactNode, forwardRef, useCallback, useRef, useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import { NodeType } from '../model/Nodes';
import { ContextMenuData } from '../hooks/useContextMenu';
import { ReactComponent as DeleteIcon } from 'majesticons/line/delete-bin-line.svg';
import { ReactComponent as SettingsCogIcon } from 'majesticons/line/settings-cog-line.svg';

interface ContextMenuProps {
  x: number;
  y: number;
  data: ContextMenuData['data'];
  onMenuItemSelected?: (nodeType: string) => void;
}

const menuStyles = css`
  position: absolute;
  background-color: var(--grey-darkest);
  border: 2px solid var(--grey-darkish);
  border-radius: 4px;
  box-shadow: 0 8px 16px var(--shadow-dark);
  font-family: 'Roboto Mono', monospace;
  color: var(--foreground);
  font-size: 13px;
  padding: 8px;
  z-index: 1;
  min-width: 150px;
  user-select: none;

  &:after {
    content: '';
    position: absolute;
    top: -8px;
    left: 5px;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 8px 8px 8px;
    border-color: transparent transparent var(--grey-darkish) transparent;
    pointer-events: none;
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
  border: 2px solid var(--grey-darkish);
  border-radius: 4px;
  box-shadow: 0 8px 16px var(--shadow-dark);
  background-color: var(--grey-darkest);
  color: var(--foreground);
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
  border-radius: 4px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  white-space: nowrap;
  transition: background-color 0.1s ease-out, color 0.1s ease-out;

  .label {
    display: flex;
    align-items: center;
    gap: 8px;
    user-select: none;
  }

  &:hover {
    background-color: #4444446e;
    color: var(--primary);
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
        border-color: transparent transparent transparent var(--grey-darkish);
      }
    `}
`;

interface MenuItemProps {
  label: string | ReactNode;
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
      <div className="label">{label}</div>
      <CSSTransition nodeRef={submenuRef} in={isSubMenuVisible} timeout={100} classNames="submenu" unmountOnExit>
        <div ref={submenuRef} css={submenuStyles}>
          {children}
        </div>
      </CSSTransition>
    </MenuItemDiv>
  );
};

export const ContextMenu = forwardRef<HTMLDivElement, ContextMenuProps>(({ x, y, data, onMenuItemSelected }, ref) => {
  let menuContent: ReactNode = null;
  if (!data) {
    menuContent = <BlankAreaContextMenu data={data} onMenuItemSelected={onMenuItemSelected} />;
  }

  if (data?.type.startsWith('node')) {
    menuContent = <NodeContextMenu data={data} onMenuItemSelected={onMenuItemSelected} />;
  }

  return (
    <div ref={ref} css={menuStyles} style={{ top: y + 4, left: x - 16 }} onClick={(e) => e.stopPropagation()}>
      {menuContent}
    </div>
  );
});

const BlankAreaContextMenu: FC<Pick<ContextMenuProps, 'data' | 'onMenuItemSelected'>> = ({
  data,
  onMenuItemSelected,
}) => {
  const addNode = useCallback(
    (nodeType: NodeType) => {
      onMenuItemSelected?.(`Add:${nodeType}`);
    },
    [onMenuItemSelected],
  );
  return (
    <MenuItem label="Add" hasSubMenu={true}>
      <MenuItem label="Prompt" onClick={() => addNode('prompt')} />
      <MenuItem label="Chat" onClick={() => addNode('chat')} />
      <MenuItem label="Text" onClick={() => addNode('text')} />
      <MenuItem label="User Input" onClick={() => addNode('userInput')} />
      <MenuItem label="Extract With Regex" onClick={() => addNode('extractRegex')} />
      <MenuItem label="Code" onClick={() => addNode('code')} />
      <MenuItem label="Match" onClick={() => addNode('match')} />
      <MenuItem label="If" onClick={() => addNode('if')} />
      <MenuItem label="If/Else" onClick={() => addNode('ifElse')} />
      <MenuItem label="Read Directory" onClick={() => addNode('readDirectory')} />
      <MenuItem label="Read File" onClick={() => addNode('readFile')} />
    </MenuItem>
  );
};

const NodeContextMenu: FC<Pick<ContextMenuProps, 'data' | 'onMenuItemSelected'>> = ({ data, onMenuItemSelected }) => {
  const nodeId = data?.element.dataset.nodeId;

  const editNode = useCallback(() => {
    onMenuItemSelected?.(`Edit:${nodeId}`);
  }, [nodeId, onMenuItemSelected]);

  const deleteNode = useCallback(() => {
    onMenuItemSelected?.(`Delete:${nodeId}`);
  }, [nodeId, onMenuItemSelected]);

  return (
    <>
      <MenuItem
        label={
          <>
            <SettingsCogIcon /> Edit
          </>
        }
        onClick={editNode}
      />
      <MenuItem
        label={
          <>
            <DeleteIcon /> Delete
          </>
        }
        onClick={deleteNode}
      />
    </>
  );
};
