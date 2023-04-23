import { css } from '@emotion/react';

export const nodeStyles = css`
  .node {
    background-color: var(--grey-dark);
    border-radius: 8px;
    border: 2px solid var(--grey);
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

  .node.overlayNode {
    border-color: var(--primary);
    transition-duration: 0;
    pointer-events: none;
    box-shadow: 10px 10px 16px rgba(0, 0, 0, 0.4), 0 0 10px var(--shadow-primary);
  }

  .node:hover,
  .node.selected {
    border-color: var(--primary);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4), 0 0 10px var(--shadow-primary);
    z-index: 1000 !important;
  }

  .node-title {
    background-color: var(--grey-darkish);
    color: var(--foreground-bright);
    padding: 12px;
    margin: -12px -12px 8px -12px;
    border-radius: 8px 8px 0 0;
    letter-spacing: 1px;
    display: flex;
    justify-content: space-between;
    user-select: none;
  }

  .grab-area {
    cursor: move;
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: -12px;
    margin-bottom: -12px;
    padding: 12px 0;
  }

  .title-text {
    font-weight: bold;
    font-size: 14px;
    text-transform: uppercase;
  }

  .title-controls {
    display: flex;
    align-items: center;
    gap: 8px;

    .success,
    .error {
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
      color: var(--grey-lighter);
      cursor: pointer;
      font-size: 18px;
      margin-left: 8px;
      transition: color 0.2s ease-out;
      margin: -12px;
      width: 46px;
      height: 46px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    button:hover {
      color: var(--primary);
    }
  }

  .node-body {
    color: var(--foreground);
    font-size: 12px;
    margin-bottom: 12px;
    line-height: 1.4;
  }

  .node-ports {
    display: flex;
    justify-content: space-between;
    margin: 0 -12px 0 -12px;
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
    transition: opacity 0.2s ease-out;
  }

  .node:hover .port-label,
  .node.overlayNode .port-label {
    opacity: 1;
  }

  .input-port {
    margin-left: -8px;
  }

  .output-port {
    margin-right: -8px;
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

  .port.connected .port-circle {
    background-color: var(--primary);
    border: 2px solid var(--primary-dark);
  }

  .port.connected .port-label {
    color: var(--primary);
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
    justify-content: flex-end;
  }

  .node-output {
    position: relative;
  }

  .node-output-inner {
    background-color: var(--grey-darker);
    background-image: linear-gradient(to bottom, var(--grey-darker) 0%, var(--grey-darkest) 100%);
    border-radius: 0 0 8px 8px;
    border-top: 2px solid var(--success-light);
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

  .node-output-warnings:hover {
    max-height: 500px;
    overflow: auto;
  }

  .node.error .node-output-inner {
    border-top-color: var(--error-light);
  }

  .node:hover .node-output-inner,
  .node.selected .node-output-inner {
    max-height: 500px;
    overflow: auto;
  }

  .node-output.errored {
    border-top: 2px solid var(--error-light);
  }

  .node-output:before {
    content: '';
    position: absolute;
    top: 10px;
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

  .node-output.errored:before {
    border-top: 8px solid var(--error-light);
  }

  .overlay-buttons {
    position: absolute;
    top: 16px;
    right: 4px;
    display: flex;
    gap: 8px;
  }

  .copy-button,
  .expand-button {
    width: 24px;
    height: 24px;
    font-size: 24px;
    opacity: 0;
    cursor: pointer;
    transition: opacity 0.2s;
    z-index: 1;
  }

  .node:hover .copy-button,
  .node:hover .expand-button {
    opacity: 0.2;
  }

  .node .copy-button:hover,
  .node .expand-button:hover {
    opacity: 1;
  }

  .node .running {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .node .running svg {
    color: var(--primary);
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;
