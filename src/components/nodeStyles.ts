import { css } from '@emotion/react';

export const nodeStyles = css`
  .node {
    background-color: #2e2e2e;
    border-radius: 8px;
    border: 2px solid #5a5a5a;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    position: absolute;
    min-width: 200px;
    padding: 12px;
    font-family: 'Roboto Mono', monospace;
    /* transition-duration: 0.2s; TODO */
    transition-timing-function: ease-out;
    transition-property: box-shadow, border-color;
  }

  .node.overlayNode {
    border-color: #ff9900;
    transition-duration: 0;
    pointer-events: none;
    box-shadow: 10px 10px 16px rgba(0, 0, 0, 0.4), 0 0 10px rgba(255, 153, 0, 0.3);
  }

  .node:hover {
    border-color: #ff9900;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4), 0 0 10px rgba(255, 153, 0, 0.3);
  }

  .node-title {
    background-color: #3d3d3d;
    color: #ffffff;
    font-weight: bold;
    font-size: 14px;
    padding: 12px;
    margin: -12px -12px 8px -12px;
    border-radius: 8px 8px 0 0;
    text-transform: uppercase;
    letter-spacing: 1px;
    cursor: move;
  }

  .node-body {
    color: #bbbbbb;
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
    color: #dddddd;
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
    background-color: #2e2e2e;
    border: 2px solid #5a5a5a;
    border-radius: 50%;
    height: 16px;
    width: 16px;
    transition: all 0.2s ease-in-out;
  }

  .input-port:hover,
  .output-port:hover {
    border-color: #ff9900;
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
    background-color: #ff9900;
    border: 2px solid #cc6600;
  }

  .port.connected .port-label {
    color: #ff9900;
  }

  .port.connected .port-label {
    position: static;
  }

  .input-ports .port.connected {
    flex-direction: row;
  }

  .output-ports .port.connected {
    flex-direction: row-reverse;
  }
`;
