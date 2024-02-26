import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { type FC, forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import { useStableCallback } from '../hooks/useStableCallback.js';
import { useFloating, useMergeRefs, autoUpdate, shift, flip } from '@floating-ui/react';
import {
  type ContextMenuConfiguration,
  useContextMenuConfiguration,
  type ContextMenuItem as ContextMenuConfigItem,
} from '../hooks/useContextMenuConfiguration';
import { useFuseSearch } from '../hooks/useFuseSearch.js';
import { uniqBy } from 'lodash-es';
import clsx from 'clsx';
import { useMarkdown } from '../hooks/useMarkdown.js';

const menuReferenceStyles = css`
  position: absolute;
  &.disabled {
    display: none;
  }
`;

export const menuStyles = css`
  background-color: var(--grey-darkest);
  border: 2px solid var(--grey-darkish);
  border-radius: 4px;
  box-shadow: 0 8px 16px var(--shadow-dark);
  font-family: 'Roboto Mono', monospace;
  color: var(--foreground);
  font-size: 13px;
  padding: 0;
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

  .context-menu-search {
    input {
      background-color: var(--grey-darkest);
      border: none;
      outline: none;
      padding: 8px;
      font-size: 14px;
      line-height: 14px;
    }
  }
`;

export type ContextMenuContext = {
  [P in keyof ContextMenuConfiguration['contexts']]: {
    type: P;
    data: ContextMenuConfiguration['contexts'][P]['contextType'];
  };
}[keyof ContextMenuConfiguration['contexts']];

export interface ContextMenuProps {
  x: number;
  y: number;
  context: ContextMenuContext;
  disabled?: boolean;
  onMenuItemSelected?: (id: string, data: unknown, context: ContextMenuContext, meta: { x: number; y: number }) => void;
}

export const ContextMenu = forwardRef<HTMLDivElement, ContextMenuProps>(
  ({ x, y, context, disabled, onMenuItemSelected }, ref) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedResultIndex, setSelectedResultIndex] = useState(0);

    const { refs, floatingStyles, update } = useFloating({
      placement: 'bottom-start',
      whileElementsMounted: autoUpdate,
      middleware: [shift({ crossAxis: true })],
    });

    const anchorRef = useMergeRefs([ref, refs.setReference]);

    const { contexts, commands } = useContextMenuConfiguration();
    const { items } = contexts[context.type];

    // Flatten the items into a single array
    const searchItems = useMemo(() => {
      if (disabled) {
        return [];
      }

      const flattenItems = (
        items: readonly ContextMenuConfigItem[],
        path: string[] = [],
      ): (ContextMenuConfigItem & { path: string[] })[] => {
        const allItems = items.reduce(
          (acc, item) => {
            const newPath = [...path, item.label];
            return acc.concat({ ...item, path: newPath }, ...flattenItems(item.items || [], newPath));
          },
          [] as (ContextMenuConfigItem & { path: string[] })[],
        );

        const onlyLeaves = allItems.filter((item) => !item.items?.length);

        const allSearchItems = [...onlyLeaves, ...commands.map((command) => ({ ...command, path: [command.label] }))];

        return uniqBy(allSearchItems, 'id');
      };

      return flattenItems(items);
    }, [items, commands, disabled]);

    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      update();
      searchRef.current?.focus();
    }, [update, x, y]);

    const handleMenuItemSelected = useStableCallback((id: string, data: unknown) => {
      onMenuItemSelected?.(id, data, context, { x, y });
    });

    const searchResults = useFuseSearch(searchItems, searchTerm, ['label', 'subLabel'], { max: 5 });
    const searchResultsItems = useMemo(() => searchResults.map((r) => r.item), [searchResults]);

    const shownItems = searchTerm.trim().length > 0 ? searchResultsItems : items;

    useEffect(() => {
      if (searchTerm.length > 0 && searchResults.length > 0 && selectedResultIndex >= searchResults.length) {
        setSelectedResultIndex(0);
      }
    }, [searchResults.length, searchTerm.length, selectedResultIndex]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          setSelectedResultIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : searchResultsItems.length - 1));
          e.preventDefault();
          break;
        case 'ArrowDown':
          setSelectedResultIndex((prevIndex) => (prevIndex < searchResultsItems.length - 1 ? prevIndex + 1 : 0));
          e.preventDefault();
          break;
        case 'Enter':
          e.preventDefault();
          if (searchResultsItems[selectedResultIndex]) {
            handleMenuItemSelected(
              searchResultsItems[selectedResultIndex]!.id,
              searchResultsItems[selectedResultIndex]!.data,
            );
          }
          break;
        default:
          break;
      }
    };
    useEffect(() => {
      if (disabled) {
        setSearchTerm('');
        setSelectedResultIndex(0);
        searchRef.current?.blur();
      } else {
        searchRef.current?.focus();
      }
    }, [disabled]);

    return (
      <div
        ref={anchorRef}
        css={menuReferenceStyles}
        style={{ top: y + 4, left: x - 16 }}
        className={clsx({ disabled })}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={floatingStyles} css={menuStyles} ref={refs.setFloating}>
          <div className="context-menu-search">
            <input
              autoComplete="off"
              spellCheck={false}
              ref={searchRef}
              autoFocus
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
            />
          </div>
          <div className="context-menu-items">
            {shownItems.map((item, index) => (
              <ContextMenuItem
                key={item.id}
                config={item}
                onMenuItemSelected={handleMenuItemSelected}
                onHover={() => setSelectedResultIndex(index)}
                context={context.data}
                active={searchTerm.length > 0 && index === selectedResultIndex}
              />
            ))}
          </div>
        </div>
      </div>
    );
  },
);

ContextMenu.displayName = 'ContextMenu';

export const submenuStyles = css`
  position: absolute;
  top: 0;
  left: 95%;
  margin-left: 4px;
  margin-top: -4px;
  min-width: 150px;
  border: 2px solid var(--grey-darkish);
  border-radius: 4px;
  box-shadow: 0 8px 16px var(--shadow-dark);
  background-color: var(--grey-darkest);
  color: var(--foreground);
  z-index: 1;
  padding: 0;
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

const infoBoxTransitionStyles = css`
  &.info-box-enter {
    opacity: 0;
  }

  &.info-box-enter-active {
    opacity: 1;
    transition: opacity 100ms ease-out;
  }

  &.info-box-exit {
    opacity: 1;
  }

  &.info-box-exit-active {
    opacity: 0;
    transition: opacity 100ms ease-out;
  }
`;

export const ContextMenuItemDiv = styled.div<{ hasSubmenu?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 4px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  white-space: nowrap;
  transition:
    background-color 0.1s ease-out,
    color 0.1s ease-out;

  .label {
    display: flex;
    align-items: center;
    gap: 8px;
    user-select: none;
  }

  .sublabel {
    font-size: 12px;
    color: var(--grey-lightish);
  }

  &:hover,
  &.active {
    background-color: var(--tertiary-light);
    color: var(--primary-text);
  }

  ${(props) =>
    props.hasSubmenu &&
    css`
      &::after {
        content: '';
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 7px 0 7px 7px;
        border-color: transparent transparent transparent var(--grey-darkish);
      }

      &:hover::after {
        border-color: transparent transparent transparent var(--primary);
      }
    `}
`;

export interface ContextMenuItemProps {
  config: ContextMenuConfigItem;
  context: unknown;
  active?: boolean;
  onMenuItemSelected?: (id: string, data: unknown) => void;
  onHover?: () => void;
}

export const ContextMenuItem: FC<ContextMenuItemProps> = ({ config, context, active, onMenuItemSelected, onHover }) => {
  const [isSubMenuVisible, setIsSubMenuVisible] = useState(false);
  const [isInfoVisible, setIsInfoVisible] = useState(false);
  const hasSubMenu = (config.items?.length ?? 0) > 0;
  const submenuFloating = useFloating({
    placement: 'right-start',
    whileElementsMounted: autoUpdate,
    middleware: [flip()],
  });

  const infoBoxFloating = useFloating({
    placement: 'right-start',
    whileElementsMounted: autoUpdate,
    middleware: [flip()],
  });

  const handleMouseEnter = useStableCallback(() => {
    if (hasSubMenu) {
      setIsSubMenuVisible(true);
    }
    setIsInfoVisible(true);
    onHover?.();
  });

  const handleMouseLeave = useStableCallback(() => {
    if (hasSubMenu) {
      setIsSubMenuVisible(false);
    }
    setIsInfoVisible(false);
  });

  const handleClick = () => {
    if (hasSubMenu) {
      return;
    }

    onMenuItemSelected?.(config.id, config.data);
  };

  const mainRef = useMergeRefs([submenuFloating.refs.setReference, infoBoxFloating.refs.setReference]);

  if (config.conditional && !config.conditional(context)) {
    return null;
  }

  return (
    <ContextMenuItemDiv
      hasSubmenu={hasSubMenu}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={mainRef}
      className={clsx({ active })}
    >
      <div className="label-area">
        <div className="label">
          {config.icon && <config.icon />}
          {config.label}
        </div>
        {config.subLabel && <div className="sublabel">{config.subLabel}</div>}
      </div>

      <CSSTransition
        nodeRef={submenuFloating.refs.floating}
        in={isSubMenuVisible}
        timeout={100}
        classNames="submenu"
        unmountOnExit
      >
        <div ref={submenuFloating.refs.setFloating} css={submenuStyles} style={submenuFloating.floatingStyles}>
          {hasSubMenu &&
            config.items!.map((subItem) => (
              <ContextMenuItem
                key={subItem.id}
                config={subItem}
                onMenuItemSelected={onMenuItemSelected}
                context={context}
              />
            ))}
        </div>
      </CSSTransition>
      {config.infoBox && (
        <CSSTransition
          nodeRef={infoBoxFloating.refs.floating}
          in={isInfoVisible || active}
          timeout={100}
          classNames="info-box"
          unmountOnExit
        >
          <div
            ref={infoBoxFloating.refs.setFloating}
            css={infoBoxTransitionStyles}
            style={infoBoxFloating.floatingStyles}
          >
            <ContextMenuInfoBox info={config.infoBox} />
          </div>
        </CSSTransition>
      )}
    </ContextMenuItemDiv>
  );
};

const contextMenuInfoBoxStyles = css`
  border: 2px solid var(--grey-darkish);
  border-radius: 4px;
  box-shadow: 0 8px 16px var(--shadow-dark);
  background-color: var(--grey-darkest);
  color: var(--foreground);
  z-index: 1;
  padding: 16px 16px;
  border-radius: 4px;
  width: 500px;
  font-family: 'Roboto', sans-serif;
  white-space: normal;

  img {
    float: right;
    max-width: 250px;
    margin: 8px;
  }

  h1 {
    font-size: 16px;
    margin-top: 0;
  }

  p {
    font-size: 13px;
  }
`;

const ContextMenuInfoBox: FC<{ info: NonNullable<ContextMenuConfigItem['infoBox']> }> = ({ info }) => {
  const markdownDescription = useMarkdown(info.description);
  return (
    <div css={contextMenuInfoBoxStyles}>
      {info.image && <img src={info.image} alt="" />}
      <h1>{info.title}</h1>
      <p dangerouslySetInnerHTML={markdownDescription} />
      <div style={{ clear: 'right' }} />
    </div>
  );
};
