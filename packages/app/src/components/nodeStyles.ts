import { css } from '@emotion/react';

export const nodeStyles = css`
  .node {
    background-color: var(--grey-dark-seethrough);
    border-radius: 8px;
    border: 2px solid var(--node-border);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    position: absolute;
    /* min-width: 300px; */
    /* max-width: 500px; */
    width: 450px;
    padding: 12px;
    font-family: 'Roboto Mono', monospace;
    /* transition-duration: 0.2s; TODO */
    transition-timing-function: ease-out;
    transition-property: box-shadow, border-color;
    transform-origin: top left;
  }

  .node.isComment {
    background-color: rgba(46, 46, 46, 0.1);
    pointer-events: none;
    padding: 0;
  }

  .node.zoomedOut {
    min-width: 200px;
  }

  .node.overlayNode {
    border-color: var(--primary);
    transition-duration: 0;
    pointer-events: none;
    box-shadow:
      10px 10px 16px rgba(0, 0, 0, 0.4),
      0 0 10px var(--shadow-primary);
  }

  .node.selected:not(.isComment),
  .node.selected:not(.isComment) {
    border-color: var(--primary);
    box-shadow:
      0 8px 16px rgba(0, 0, 0, 0.4),
      0 0 10px var(--shadow-primary);
    z-index: 10000 !important;
  }

  .node-title {
    background-color: var(--node-bg);
    color: var(--node-bg-foreground);
    padding: 12px;
    margin: -12px -12px 8px -12px;
    border-radius: 6px 6px 0 0;
    letter-spacing: 1px;
    display: flex;
    justify-content: space-between;
    user-select: none;
    overflow: hidden;
    word-break: break-word;
    hyphens: auto;
  }

  .node.node.isComment .node-title {
    padding: 4px;
    background-color: var(--grey-darkish-seethrough);
    pointer-events: all;
    margin: 0;
  }

  .node.zoomedOut .node-title {
    padding: 24px;
    line-height: 35px;
  }

  .grab-area {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: -12px;
    margin-bottom: -12px;
    padding: 12px 0;
    cursor: pointer;

    &.grabbable {
      cursor: move;
    }
  }

  .title-text {
    font-weight: bold;
    font-size: 14px;
    text-transform: uppercase;
  }

  .node.isComment .title-text {
    display: none;
  }

  .node.zoomedOut .title-text {
    font-size: 25px;
  }

  .title-controls {
    display: flex;
    align-items: center;
    gap: 0;
    margin-right: -8px;

    .success,
    .error,
    .interrupted,
    .not-ran {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .success {
      color: var(--success);
    }

    .error {
      color: var(--error);
    }

    button {
      background-color: transparent;
      border: none;
      color: var(--node-bg-foreground);
      cursor: pointer;
      font-size: 18px;
      transition: color 0.2s ease-out;
      margin: -12px 0;
      width: 30px;
      height: 46px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;

      svg {
        width: 18px;
      }
    }

    button:hover {
      color: var(--primary-text);
    }
  }

  .node.isPinned .title-controls .pin-button {
    color: var(--primary-text);
  }

  .title-controls .tooltip {
    display: flex;
    align-items: center;
  }

  .node.isComment .title-controls {
    .success,
    .error {
      display: none;
    }
  }

  .node.zoomedOut .title-controls {
    position: absolute;
    right: 10px;
    top: 10px;
  }

  .node-body {
    color: var(--foreground);
    font-size: 12px;
    margin-bottom: 12px;
    line-height: 1.4;
  }

  .node.isComment .node-body {
    height: 100%;
  }

  .node-ports {
    display: flex;
    justify-content: space-between;
    margin: 0 -12px 0 -12px;
  }

  .node-ports-groups {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .node-ports-group {
    display: flex;
    flex-direction: column;
    gap: 8px;

    > header {
      background: var(--node-bg);
      color: var(--node-bg-foreground);
      align-self: flex-start;
      padding: 4px 8px;
      margin-left: -12px;
      font-size: 12px;
      font-family: var(--font-family-monospace);
      border-radius: 0 4px 4px 0;
      user-select: none;
    }
  }

  .input-ports,
  .output-ports {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .input-ports .port {
    flex-direction: row-reverse;
    justify-content: flex-end;
  }

  .output-ports .port {
    justify-content: flex-end;
  }

  .port {
    display: flex;
    align-items: center;
    position: relative;
  }

  .port-label {
    color: var(--grey-lighter);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 0 4px;
    white-space: nowrap;
    user-select: none;
    opacity: 0.5;
    cursor: default;
  }

  .node.zoomedOut .port-label {
    display: none;
  }

  .node.selected .port-label,
  .node.overlayNode .port-label,
  .port-label:hover {
    opacity: 1;
  }

  .node.zoomedOut .port:hover .port-label {
    display: block;
    font-size: 20px;
    line-height: 12px;
  }

  .input-port {
    margin-left: -8px;
  }

  .output-port {
    margin-right: -8px;
  }

  .port-circle {
    position: relative;
  }

  .input-port,
  .output-port {
    background-color: var(--grey-dark);
    border: 2px solid var(--grey);
    border-radius: 50%;
    height: 16px;
    width: 16px;
    transition: all 0.2s ease-in-out;
  }

  .input-port:hover,
  .output-port:hover {
    border-color: var(--primary);
    cursor: pointer;
  }

  .input-ports .port-label {
    text-align: right;
    position: absolute;
    right: calc(100% + 8px);
  }

  .output-ports .port-label {
    text-align: left;
    position: absolute;
    left: calc(100% + 8px);
  }

  .port.connected .port-circle,
  .port.closest .port-circle {
    background-color: var(--primary);
    border: 2px solid var(--primary-dark);
  }

  .port.compatible:not(.connected) .port-circle {
    border: 2px solid var(--success);
  }

  .port.coerced .port-circle {
    border: 2px solid var(--warning);
  }

  .port.incompatible .port-circle {
    border: 2px solid var(--error);
  }

  .port.connected .port-label {
    color: var(--primary-text);
  }

  .port.connected .port-label {
    position: static;
  }

  .input-ports .port.connected {
    flex-direction: row;
    justify-content: flex-start;
  }

  .output-ports .port.connected {
    flex-direction: row-reverse;
    justify-content: flex-start;
  }

  .node-output {
    position: relative;
    z-index: 0;
  }

  .node.isComment .node-output {
    display: none;
  }

  .node-output-inner,
  .multi-node-output {
    background-color: var(--grey-darker);
    background-image: linear-gradient(to bottom, var(--grey-darker) 0%, var(--grey-darkest) 100%);
    border-radius: 0 0 8px 8px;
    border-top: 2px solid var(--success-light);
    color: var(--foreground-bright);
    font-size: 12px;
    line-height: 1.4;
    margin: 8px -12px -12px -12px;
    padding: 12px;
    position: relative;
    transition: border-color 0.2s ease-out;
    max-height: 50px;
    transition: max-height 0.2s ease-out;
    overflow: hidden;
  }

  .multi-node-output {
    padding: 0;
    margin-bottom: -8px;
  }

  .node-output-warnings {
    background-color: var(--grey-darker);
    background-image: linear-gradient(to bottom, var(--grey-darker) 0%, var(--grey-darkest) 100%);
    border-radius: 0 0 8px 8px;
    border-top: 2px solid var(--warning-light);
    color: var(--foreground-bright);
    font-size: 12px;
    line-height: 1.4;
    margin: -2px -12px -12px -12px;
    padding: 12px;
    position: relative;
    transition: border-color 0.2s ease-out;
    margin-top: 8px;
    max-height: 50px;
    transition: max-height 0.2s ease-out;
    overflow: hidden;
  }

  .node.running .node-output:not(.multi) .node-output-inner,
  .node.running .multi-node-output {
    border-top-color: var(--primary);
  }

  .node-output.multi .node-output-inner.node-output-inner {
    border-top: 1px solid var(--grey-light);
  }

  .node-output-warnings:hover {
    max-height: 500px;
    overflow: auto;
  }

  .node.error .node-output:not(.multi) .node-output-inner,
  .node.error .multi-node-output {
    border-top-color: var(--error-light);
  }

  .node.not-ran .node-output:not(.multi) .node-output-inner,
  .node.not-ran .multi-node-output {
    border-top-style: dashed;
    border-top-color: var(--grey-lightish);
  }

  .node:hover .node-output-inner {
    max-height: 500px;
    overflow: auto;
  }

  .node.isPinned .node-output-inner {
    max-height: unset;
    overflow: auto;
  }

  .node .node-output.errored:not(.multi) {
    border-top: 2px solid var(--error-light);
  }

  .node-output.multi:before {
    top: 2px;
  }

  .node-output:before {
    content: '';
    position: absolute;
    top: 1px;
    left: 50%;
    z-index: 2;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid var(--success-light);
  }

  .node.success .node-output:before {
    border-top-color: var(--success-light);
  }

  .node.error .node-output:before {
    border-top-color: var(--error-light);
  }

  .node.not-ran .node-output:before {
    border-top-color: var(--grey-lightish);
  }

  .node-output.errored:before {
    border-top: 8px solid var(--error-light);
  }

  .node.running .node-output:before {
    border-top-color: var(--primary);
  }

  .overlay-buttons {
    position: absolute;
    top: 8px;
    right: 4px;
    display: flex;
    gap: 8px;
    z-index: 10;
  }

  .copy-button,
  .expand-button,
  .prompt-designer-button {
    width: 24px;
    height: 24px;
    font-size: 24px;
    opacity: 0.2;
    cursor: pointer;
    transition: opacity 0.2s;
    z-index: 1;
  }

  .node:hover .copy-button,
  .node:hover .expand-button,
  .node:hover .prompt-designer-button {
    opacity: 0.35;
  }

  .node .copy-button:hover,
  .node .expand-button:hover,
  .node .prompt-designer-button:hover {
    opacity: 1;
  }

  .node .running {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .resize-handle {
    width: 10px;
    height: 100%;
    height: 10px;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.25);
    cursor: ew-resize;
    position: absolute;
    right: 0;
    border-top-left-radius: 100px;
    border-bottom-right-radius: 50px;
  }

  .node.isComment .resize-handle {
    cursor: nwse-resize;
    pointer-events: all;
    width: 20px;
    height: 20px;
  }

  .node.running {
    box-shadow:
      0 0 16px var(--shadow-primary-bright),
      0 8px 16px rgba(0, 0, 0, 0.4);
  }

  .split-output {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .picker {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    user-select: none;
    height: 32px;

    .picker-left,
    .picker-right {
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      cursor: pointer;
      border: 0;
      margin: 0;
      padding: 0;
      width: 32px;
      height: 32px;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }

    .picker-left {
      border-right: 1px solid rgba(255, 255, 255, 0.1);
    }

    .picker-right {
      border-left: 1px solid rgba(255, 255, 255, 0.1);
    }
  }

  .multi-node-output-inner {
    padding: 12px;
  }

  .port-hover-area {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    position: absolute;
    left: 8px;
    top: 8px;
    transform: translate(-50%, -50%);
    /* background-color: rgba(1, 1, 1, 0.5); */
  }

  .node-output .function-call {
    h4 {
      margin-top: 0;
      margin-bottom: 0;
      text-decoration: none;
      font-size: 12px;
      font-weight: normal;
      color: var(--primary-text);
    }
  }

  .node.disabled {
    opacity: 0.5;

    .node-title {
      text-decoration: line-through;
    }
  }

  .port-id-label {
    font-style: normal;
    color: var(--primary);
    font-family: var(--font-family-monospace);
  }

  .rendered-data-outputs {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
`;
