import { css } from '@emotion/react';
import { type Placement, shift, useFloating, offset, useMergeRefs } from '@floating-ui/react';
import { useToggle } from 'ahooks';
import { useRef, type FC, type ReactNode } from 'react';
import { useStableCallback } from '../hooks/useStableCallback';
import { CSSTransition } from 'react-transition-group';
import Portal from '@atlaskit/portal';
import clsx from 'clsx';

export type TooltipProps = {
  children: ReactNode;
  content: ReactNode;
  tag?: 'div' | 'span';
  placement?: Placement;
  delay?: number;
  width?: number;
  wrap?: boolean;
  className?: string;
};

const TRANSITION_TIME = 150;

const style = css`
  position: absolute;
  z-index: 1000;

  .box {
    background: var(--grey-light);
    border: 1px solid var(--grey-dark);
    color: var(--grey-darker);
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.1),
      0 2px 4px rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    transition:
      opacity ${TRANSITION_TIME}ms ease-out,
      transform ${TRANSITION_TIME}ms ease-out;
    display: none;
  }

  &.tooltip-enter .box {
    display: block;
    opacity: 0;
    transform: translateY(-8px);
  }

  &.tooltip-enter-active .box {
    display: block;
    opacity: 1;
    transform: translateY(0);
  }

  &.tooltip-exit .box {
    display: block;
    opacity: 1;
    transform: translateY(0);
  }

  &.tooltip-exit-active .box {
    display: block;
    opacity: 0;
    transform: translateY(-8px);
  }

  &.tooltip-exit-done .box {
    display: none;
    transform: translateY(-8px);
  }

  &.tooltip-enter-done .box {
    display: block;
    opacity: 1;
    transform: translateY(0);
  }
`;

export const Tooltip: FC<TooltipProps> = ({
  children,
  content,
  tag: Tag = 'div',
  placement = 'top',
  delay = 500,
  width,
  wrap = false,
  className,
}) => {
  const { refs, floatingStyles, update } = useFloating({
    placement,
    middleware: [offset(5), shift({ crossAxis: true })],
  });

  const [show, toggleShow] = useToggle(false);
  const timeoutRef = useRef<number | null>(null);
  const outTimeoutRef = useRef<number | null>(null);
  const floatingRef = useRef<HTMLDivElement | null>(null);

  const combinedFloatingRefs = useMergeRefs([floatingRef, refs.setFloating]);

  const handleMouseOver = useStableCallback(() => {
    if (outTimeoutRef.current) {
      window.clearTimeout(outTimeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      toggleShow.setRight();
    }, delay);
  });

  const handleMouseOut = useStableCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    outTimeoutRef.current = window.setTimeout(() => {
      toggleShow.setLeft();
    }, 50);
  });

  return (
    <Tag
      ref={refs.setReference}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      className={clsx('tooltip', className)}
    >
      {children}
      <Portal>
        <CSSTransition
          nodeRef={floatingRef}
          in={show}
          timeout={TRANSITION_TIME}
          classNames="tooltip"
          onEntering={() => update()}
          onEntered={() => update()}
          onExiting={() => update()}
          onExited={() => update()}
        >
          <div
            css={style}
            ref={combinedFloatingRefs}
            style={{
              ...floatingStyles,
              whiteSpace: wrap ? 'normal' : 'nowrap',
              width,
            }}
          >
            <div className="box">{content}</div>
          </div>
        </CSSTransition>
      </Portal>
    </Tag>
  );
};
