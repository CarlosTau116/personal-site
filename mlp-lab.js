/* =========================================================
   MLP learning-parameter lab
   Pure browser implementation of the 2-2-1 XOR experiment.
   ========================================================= */

(() => {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const TOTAL_EPOCHS = 300;
  const INITIAL = [
    2.0, -2.0, -2.0, 2.0, // W
    -1.0, -1.0,           // hidden biases
    3.0, 3.0,             // output weights
    -2.5                  // output bias
  ];
  const DATA = [
    { x: [0, 0], y: 0, label: '00' },
    { x: [0, 1], y: 1, label: '01' },
    { x: [1, 0], y: 1, label: '10' },
    { x: [1, 1], y: 0, label: '11' }
  ];
  const COLORS = {
    ink: '#10110d',
    paper: '#f2f0e8',
    paper2: '#faf8f1',
    paper3: '#e9e5d9',
    muted: '#6f7166',
    lime: '#d8ff3e',
    limeDeep: '#8fae16',
    orange: '#ff6a3d',
    blue: '#5b68c7',
    lilac: '#8d9fff'
  };
  const ADAM = { beta1: 0.9, beta2: 0.999, eps: 1e-8 };
  const LABELS = ['00', '01', '10', '11'];
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const sigmoid = (z) => 1 / (1 + Math.exp(-z));
  const padEpoch = (epoch) => String(epoch).padStart(3, '0');
  const fmt = (value, digits = 3) => `${value < 0 ? '−' : ''}${Math.abs(value).toFixed(digits)}`;

  let history = [];
  let cursor = 0;
  let learningRate = 0.03;
  let playing = false;
  let playTimer = null;
  let refs = {};

  // ---------------------------------------------------------
  // Model
  // ---------------------------------------------------------
  function unpack(theta) {
    return {
      W: [
        [theta[0], theta[1]],
        [theta[2], theta[3]]
      ],
      bh: [theta[4], theta[5]],
      v: [theta[6], theta[7]],
      bo: theta[8]
    };
  }

  function forward(theta) {
    const { W, bh, v, bo } = unpack(theta);
    const hidden = DATA.map(({ x }) => {
      const h1 = sigmoid(x[0] * W[0][0] + x[1] * W[1][0] + bh[0]);
      const h2 = sigmoid(x[0] * W[0][1] + x[1] * W[1][1] + bh[1]);
      return [h1, h2];
    });
    const logits = hidden.map(([h1, h2]) => h1 * v[0] + h2 * v[1] + bo);
    const probs = logits.map(sigmoid);
    return { hidden, logits, probs };
  }

  function bceWithLogits(logits) {
    return DATA.reduce((total, sample, index) => {
      const z = logits[index];
      return total + Math.max(z, 0) - z * sample.y + Math.log1p(Math.exp(-Math.abs(z)));
    }, 0) / DATA.length;
  }

  function gradients(theta) {
    const { v } = unpack(theta);
    const { hidden, probs } = forward(theta);
    const dW = [0, 0, 0, 0];
    const dbh = [0, 0];
    const dv = [0, 0];
    let dbo = 0;

    DATA.forEach((sample, index) => {
      const dLogit = (probs[index] - sample.y) / DATA.length;
      const [h1, h2] = hidden[index];

      dv[0] += h1 * dLogit;
      dv[1] += h2 * dLogit;
      dbo += dLogit;

      const dh1 = dLogit * v[0];
      const dh2 = dLogit * v[1];
      const dpre1 = dh1 * h1 * (1 - h1);
      const dpre2 = dh2 * h2 * (1 - h2);
      const [x1, x2] = sample.x;

      dW[0] += x1 * dpre1;
      dW[1] += x1 * dpre2;
      dW[2] += x2 * dpre1;
      dW[3] += x2 * dpre2;
      dbh[0] += dpre1;
      dbh[1] += dpre2;
    });

    return [...dW, ...dbh, ...dv, dbo];
  }

  function stateAt(epoch, theta) {
    const { hidden, probs } = forward(theta);
    const loss = bceWithLogits(forward(theta).logits);
    const preds = probs.map((probability) => (probability >= 0.5 ? 1 : 0));
    const correct = preds.reduce((sum, pred, index) => sum + (pred === DATA[index].y ? 1 : 0), 0);
    return {
      epoch,
      theta: theta.slice(),
      hidden,
      probs,
      preds,
      loss,
      accuracy: correct / DATA.length
    };
  }

  function train(lr) {
    let theta = INITIAL.slice();
    const moments = Array(9).fill(0);
    const velocities = Array(9).fill(0);
    const states = [stateAt(0, theta)];

    for (let epoch = 1; epoch <= TOTAL_EPOCHS; epoch += 1) {
      const grad = gradients(theta);

      for (let index = 0; index < theta.length; index += 1) {
        moments[index] = ADAM.beta1 * moments[index] + (1 - ADAM.beta1) * grad[index];
        velocities[index] = ADAM.beta2 * velocities[index] + (1 - ADAM.beta2) * grad[index] * grad[index];
        const mHat = moments[index] / (1 - Math.pow(ADAM.beta1, epoch));
        const vHat = velocities[index] / (1 - Math.pow(ADAM.beta2, epoch));
        theta[index] -= lr * mHat / (Math.sqrt(vHat) + ADAM.eps);
      }

      states.push(stateAt(epoch, theta));
    }

    return states;
  }

  // ---------------------------------------------------------
  // Small SVG helpers
  // ---------------------------------------------------------
  function svgElement(tag, attrs = {}, text = null) {
    const element = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value !== null && value !== undefined) element.setAttribute(key, String(value));
    });
    if (text !== null) element.textContent = text;
    return element;
  }

  function append(parent, ...children) {
    children.forEach((child) => parent.append(child));
    return parent;
  }

  function addChartGrid(svg, plot, xTicks, yTicks, labels = true) {
    const grid = svgElement('g');
    xTicks.forEach((tick) => {
      const x = plot.x + tick * plot.w;
      append(grid, svgElement('line', {
        x1: x, y1: plot.y, x2: x, y2: plot.y + plot.h,
        class: 'chart-grid'
      }));
      if (labels) {
        append(grid, svgElement('text', {
          x, y: plot.y + plot.h + 14,
          class: 'chart-text', 'text-anchor': 'middle'
        }, String(tick)));
      }
    });
    yTicks.forEach((tick, index) => {
      const y = plot.y + plot.h - tick * plot.h;
      append(grid, svgElement('line', {
        x1: plot.x, y1: y, x2: plot.x + plot.w, y2: y,
        class: 'chart-grid'
      }));
      if (labels && index < yTicks.length - 1) {
        append(grid, svgElement('text', {
          x: plot.x - 8, y: y + 2,
          class: 'chart-text', 'text-anchor': 'end'
        }, String(tick)));
      }
    });
    svg.append(grid);
  }

  // ---------------------------------------------------------
  // Network diagram
  // ---------------------------------------------------------
  function initNetwork() {
    const svg = refs.network;
    svg.replaceChildren();
    svg.append(svgElement('desc', {}, '2-2-1 神经网络：输入层两个节点，隐藏层两个 sigmoid 节点，输出层一个节点。'));

    const input = [
      { x: 105, y: 145, label: 'x₁' },
      { x: 105, y: 275, label: 'x₂' }
    ];
    const hidden = [
      { x: 375, y: 95, label: 'h₁' },
      { x: 375, y: 315, label: 'h₂' }
    ];
    const output = { x: 650, y: 205, label: 'ŷ' };

    const layerLabel = (x, text) => svgElement('text', {
      x, y: 26, class: 'net-layer-label', 'text-anchor': 'middle'
    }, text);
    svg.append(layerLabel(105, 'INPUT / 2'), layerLabel(375, 'HIDDEN / SIGMOID'), layerLabel(650, 'OUTPUT / 1'));

    const edges = {};
    const edge = (key, from, to) => {
      const line = svgElement('line', {
        x1: from.x, y1: from.y, x2: to.x, y2: to.y,
        class: 'net-edge', stroke: COLORS.lime, 'stroke-width': 1.2, opacity: 0.25
      });
      svg.append(line);
      edges[key] = line;
    };

    edge('w0', input[0], hidden[0]);
    edge('w1', input[0], hidden[1]);
    edge('w2', input[1], hidden[0]);
    edge('w3', input[1], hidden[1]);
    edge('v0', hidden[0], output);
    edge('v1', hidden[1], output);

    const nodes = svgElement('g');
    const addNode = (item, kind, radius) => {
      const group = svgElement('g', {
        class: `net-node net-${kind}`,
        transform: `translate(${item.x} ${item.y})`
      });
      append(group,
        svgElement('circle', { r: radius, class: 'net-node-ring' }),
        svgElement('text', { class: 'net-node-label', 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, item.label)
      );
      nodes.append(group);
    };

    input.forEach((item) => addNode(item, 'input', 25));
    hidden.forEach((item) => addNode(item, 'hidden', 29));
    addNode(output, 'output', 30);
    svg.append(nodes);

    const biasH1 = svgElement('text', { x: 430, y: 88, class: 'net-bias-label', 'text-anchor': 'start' }, 'b_h1');
    const biasH2 = svgElement('text', { x: 430, y: 308, class: 'net-bias-label', 'text-anchor': 'start' }, 'b_h2');
    const biasOut = svgElement('text', { x: 650, y: 256, class: 'net-bias-label', 'text-anchor': 'middle' }, 'b_o');
    svg.append(biasH1, biasH2, biasOut);

    refs.networkEdges = edges;
    refs.networkBiases = { h1: biasH1, h2: biasH2, out: biasOut };
  }

  function updateNetwork(state) {
    const theta = state.theta;
    const values = {
      w0: theta[0], w1: theta[1], w2: theta[2], w3: theta[3],
      v0: theta[6], v1: theta[7]
    };

    Object.entries(values).forEach(([key, value]) => {
      const line = refs.networkEdges[key];
      const magnitude = Math.min(Math.abs(value), 7);
      line.setAttribute('stroke', value >= 0 ? COLORS.lime : COLORS.orange);
      line.setAttribute('stroke-width', (1.1 + magnitude * 0.72).toFixed(2));
      line.setAttribute('opacity', (0.24 + (magnitude / 7) * 0.66).toFixed(2));
    });

    refs.networkBiases.h1.textContent = `b_h1 ${fmt(theta[4], 2)}`;
    refs.networkBiases.h2.textContent = `b_h2 ${fmt(theta[5], 2)}`;
    refs.networkBiases.out.textContent = `b_o ${fmt(theta[8], 2)}`;
  }

  // ---------------------------------------------------------
  // Numeric readouts
  // ---------------------------------------------------------
  function updateParams(state) {
    const values = state.theta;
    const indices = { w0: 0, w1: 1, w2: 2, w3: 3, bh0: 4, bh1: 5, v0: 6, v1: 7, bo: 8 };
    $$('[data-param]').forEach((element) => {
      const value = values[indices[element.dataset.param]];
      element.textContent = fmt(value, 3);
      element.classList.toggle('is-positive', value > 0.0005);
      element.classList.toggle('is-negative', value < -0.0005);
    });
  }

  function updateMetrics(state) {
    refs.metricEpoch.textContent = padEpoch(state.epoch);
    refs.epochReadout.textContent = padEpoch(state.epoch);
    refs.metricLoss.textContent = state.loss.toFixed(4);
    refs.metricAcc.textContent = `${Math.round(state.accuracy * 100)}%`;
    refs.metricLr.textContent = learningRate.toFixed(2);
    refs.lossCurrent.textContent = state.loss.toFixed(4);
    refs.epochRange.value = String(state.epoch);
    refs.epochRange.style.setProperty('--progress', `${(state.epoch / TOTAL_EPOCHS) * 100}%`);
    refs.epochRange.setAttribute('aria-valuetext', `第 ${state.epoch} 轮，损失 ${state.loss.toFixed(4)}`);
  }

  function updateOutputs(state) {
    refs.outputRows.forEach((row, index) => {
      const sample = DATA[index];
      const probability = state.probs[index];
      const predicted = state.preds[index];
      row.classList.toggle('is-correct', predicted === sample.y);
      row.classList.toggle('is-wrong', predicted !== sample.y);
      $('.prob-fill', row).style.width = `${probability * 100}%`;
      $('.prob-value', row).textContent = probability.toFixed(3);
      $('.pred-chip', row).textContent = String(predicted);
    });

    refs.outputBars.forEach((bar, index) => {
      const probability = state.probs[index];
      $('.output-bar-value', bar).textContent = probability.toFixed(3);
      $('.output-bar-track i', bar).style.height = `${Math.max(3, probability * 100)}%`;
    });
  }

  // ---------------------------------------------------------
  // Decision boundary canvas
  // ---------------------------------------------------------
  const boundary = {
    canvas: null,
    ctx: null,
    offscreen: null,
    offctx: null,
    plot: { x: 64, y: 26, w: 552, h: 552 },
    xmin: -0.2,
    xmax: 1.2
  };

  function initBoundary() {
    boundary.canvas = $('#boundary-canvas');
    boundary.ctx = boundary.canvas.getContext('2d');
    boundary.offscreen = document.createElement('canvas');
    boundary.offscreen.width = 180;
    boundary.offscreen.height = 180;
    boundary.offctx = boundary.offscreen.getContext('2d');
  }

  function probabilityAt(x1, x2, theta) {
    const { W, bh, v, bo } = unpack(theta);
    const h1 = sigmoid(x1 * W[0][0] + x2 * W[1][0] + bh[0]);
    const h2 = sigmoid(x1 * W[0][1] + x2 * W[1][1] + bh[1]);
    return sigmoid(h1 * v[0] + h2 * v[1] + bo);
  }

  function mapBoundary(x1, x2) {
    const { plot, xmin, xmax } = boundary;
    return {
      x: plot.x + ((x1 - xmin) / (xmax - xmin)) * plot.w,
      y: plot.y + (1 - (x2 - xmin) / (xmax - xmin)) * plot.h
    };
  }

  function interpolateColor(from, to, amount) {
    return from.map((channel, index) => Math.round(channel + (to[index] - channel) * amount));
  }

  function drawBoundaryContour(ctx, field, resolution, plot, xmin, xmax) {
    const step = 2;
    ctx.save();
    ctx.strokeStyle = 'rgba(16, 17, 13, 0.6)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();

    for (let yIndex = 0; yIndex < resolution - step; yIndex += step) {
      for (let xIndex = 0; xIndex < resolution - step; xIndex += step) {
        const p00 = field[yIndex * resolution + xIndex];
        const p10 = field[yIndex * resolution + xIndex + step];
        const p01 = field[(yIndex + step) * resolution + xIndex];
        const p11 = field[(yIndex + step) * resolution + xIndex + step];
        const points = [];
        const addPoint = (gx, gy) => {
          points.push([
            plot.x + (gx / resolution) * plot.w,
            plot.y + (gy / resolution) * plot.h
          ]);
        };

        if ((p00 < 0.5) !== (p10 < 0.5)) {
          const t = (0.5 - p00) / (p10 - p00);
          addPoint(xIndex + step * t, yIndex);
        }
        if ((p10 < 0.5) !== (p11 < 0.5)) {
          const t = (0.5 - p10) / (p11 - p10);
          addPoint(xIndex + step, yIndex + step * t);
        }
        if ((p01 < 0.5) !== (p11 < 0.5)) {
          const t = (0.5 - p01) / (p11 - p01);
          addPoint(xIndex + step * t, yIndex + step);
        }
        if ((p00 < 0.5) !== (p01 < 0.5)) {
          const t = (0.5 - p00) / (p01 - p00);
          addPoint(xIndex, yIndex + step * t);
        }

        if (points.length === 2) {
          ctx.moveTo(points[0][0], points[0][1]);
          ctx.lineTo(points[1][0], points[1][1]);
        } else if (points.length === 4) {
          ctx.moveTo(points[0][0], points[0][1]);
          ctx.lineTo(points[1][0], points[1][1]);
          ctx.moveTo(points[2][0], points[2][1]);
          ctx.lineTo(points[3][0], points[3][1]);
        }
      }
    }

    ctx.stroke();
    ctx.restore();
  }

  function renderBoundary(state) {
    const { ctx, canvas, plot, xmin, xmax } = boundary;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = COLORS.paper2;
    ctx.fillRect(0, 0, width, height);

    const resolution = 180;
    const image = boundary.offctx.createImageData(resolution, resolution);
    const field = new Float32Array(resolution * resolution);
    const orange = [255, 106, 61];
    const middle = [244, 241, 232];
    const lime = [177, 214, 38];

    for (let yIndex = 0; yIndex < resolution; yIndex += 1) {
      const x2 = xmax - ((yIndex + 0.5) / resolution) * (xmax - xmin);
      for (let xIndex = 0; xIndex < resolution; xIndex += 1) {
        const x1 = xmin + ((xIndex + 0.5) / resolution) * (xmax - xmin);
        const probability = probabilityAt(x1, x2, state.theta);
        field[yIndex * resolution + xIndex] = probability;
        let color;
        if (probability <= 0.5) {
          color = interpolateColor(orange, middle, probability * 2);
        } else {
          color = interpolateColor(middle, lime, (probability - 0.5) * 2);
        }

        const offset = (yIndex * resolution + xIndex) * 4;
        image.data[offset] = color[0];
        image.data[offset + 1] = color[1];
        image.data[offset + 2] = color[2];
        image.data[offset + 3] = 255;
      }
    }

    boundary.offctx.putImageData(image, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(boundary.offscreen, plot.x, plot.y, plot.w, plot.h);
    drawBoundaryContour(ctx, field, resolution, plot, xmin, xmax);

    // Plot border and grid.
    ctx.strokeStyle = 'rgba(16, 17, 13, 0.26)';
    ctx.lineWidth = 1;
    ctx.strokeRect(plot.x + 0.5, plot.y + 0.5, plot.w - 1, plot.h - 1);

    ctx.font = '10px "Cascadia Mono", Consolas, monospace';
    ctx.fillStyle = COLORS.muted;
    [0, 0.5, 1].forEach((tick) => {
      const x = plot.x + ((tick - xmin) / (xmax - xmin)) * plot.w;
      const y = plot.y + (1 - (tick - xmin) / (xmax - xmin)) * plot.h;
      ctx.strokeStyle = 'rgba(16, 17, 13, 0.18)';
      ctx.beginPath();
      ctx.moveTo(x, plot.y);
      ctx.lineTo(x, plot.y + plot.h);
      ctx.moveTo(plot.x, y);
      ctx.lineTo(plot.x + plot.w, y);
      ctx.stroke();
      ctx.fillText(String(tick), x - 3, plot.y + plot.h + 17);
      ctx.fillText(String(tick), plot.x - 20, y + 4);
    });

    ctx.font = '11px "Helvetica Neue", "Microsoft YaHei", sans-serif';
    ctx.fillText('x₁', plot.x + plot.w / 2 - 5, plot.y + plot.h + 38);
    ctx.save();
    ctx.translate(plot.x - 41, plot.y + plot.h / 2 + 5);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('x₂', 0, 0);
    ctx.restore();

    // XOR sample points.
    const offsets = {
      '00': [10, -10],
      '01': [10, 16],
      '10': [-28, 16],
      '11': [-30, -10]
    };

    DATA.forEach((sample) => {
      const { x, y } = mapBoundary(sample.x[0], sample.x[1]);
      const color = sample.y === 0 ? COLORS.orange : COLORS.limeDeep;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      const [dx, dy] = offsets[sample.label];
      ctx.font = '9px "Cascadia Mono", Consolas, monospace';
      ctx.lineWidth = 3;
      ctx.strokeStyle = COLORS.paper2;
      ctx.strokeText(sample.label, x + dx, y + dy);
      ctx.fillStyle = COLORS.ink;
      ctx.fillText(sample.label, x + dx, y + dy);
    });
  }

  // ---------------------------------------------------------
  // Hidden representation chart
  // ---------------------------------------------------------
  function initHiddenChart() {
    const svg = refs.hiddenChart;
    svg.replaceChildren();
    svg.append(svgElement('desc', {}, '四个 XOR 样本在隐藏空间中的轨迹。颜色表示目标类别。'));
    const plot = { x: 48, y: 26, w: 278, h: 278 };
    addChartGrid(svg, plot, [0, 0.5, 1], [0, 0.5, 1], false);

    const axisLabels = svgElement('g');
    append(axisLabels,
      svgElement('text', { x: plot.x + plot.w / 2, y: plot.y + plot.h + 24, class: 'chart-text', 'text-anchor': 'middle' }, 'h₁'),
      svgElement('text', { x: 8, y: plot.y + plot.h / 2, class: 'chart-text', 'text-anchor': 'middle', transform: `rotate(-90 8 ${plot.y + plot.h / 2})` }, 'h₂'),
      svgElement('text', { x: plot.x - 9, y: plot.y + plot.h + 4, class: 'chart-text', 'text-anchor': 'end' }, '0'),
      svgElement('text', { x: plot.x + plot.w + 9, y: plot.y + plot.h + 4, class: 'chart-text', 'text-anchor': 'start' }, '1'),
      svgElement('text', { x: plot.x - 9, y: plot.y + 4, class: 'chart-text', 'text-anchor': 'end' }, '1')
    );
    svg.append(axisLabels);

    const separator = svgElement('g', { visibility: 'hidden' });
    const sx1 = plot.x;
    const sy1 = plot.y + plot.h - (0.55 - 0) / 1 * plot.h;
    const sx2 = plot.x + 0.55 * plot.w;
    const sy2 = plot.y + plot.h;
    append(separator,
      svgElement('line', {
        x1: sx1, y1: sy1, x2: sx2, y2: sy2,
        stroke: COLORS.ink, 'stroke-width': 1, 'stroke-dasharray': '4 4', opacity: 0.45
      }),
      svgElement('text', {
        x: plot.x + plot.w - 8, y: plot.y + plot.h - 22,
        class: 'chart-text--note', 'text-anchor': 'end'
      }, 'linear readout')
    );
    svg.append(separator);

    const traces = svgElement('g');
    const points = svgElement('g');
    const labels = svgElement('g');
    const series = DATA.map((sample) => {
      const color = sample.y === 0 ? COLORS.orange : COLORS.limeDeep;
      const trace = svgElement('path', {
        class: 'chart-trace', fill: 'none', stroke: color, 'stroke-width': 1.1,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      });
      const point = svgElement('circle', {
        class: 'chart-point', r: 5.5, fill: color, stroke: COLORS.ink,
        'stroke-width': 1
      });
      const label = svgElement('text', {
        class: 'chart-text', 'font-size': 8, fill: COLORS.ink
      }, sample.label);
      traces.append(trace);
      points.append(point);
      labels.append(label);
      return { trace, point, label };
    });
    append(svg, traces, points, labels);

    refs.hidden = { plot, series, separator };
  }

  function hiddenPoint(plot, hidden) {
    return {
      x: plot.x + hidden[0] * plot.w,
      y: plot.y + (1 - hidden[1]) * plot.h
    };
  }

  function renderHidden(state) {
    const { plot, series, separator } = refs.hidden;
    const offsets = {
      '00': [8, -8],
      '01': [9, 9],
      '10': [-28, 9],
      '11': [9, 16]
    };

    series.forEach((item, index) => {
      const current = hiddenPoint(plot, state.hidden[index]);
      const points = history.slice(0, state.epoch + 1).map((entry) => hiddenPoint(plot, entry.hidden[index]));
      let path = '';
      points.forEach((point, pointIndex) => {
        path += `${pointIndex === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)} `;
      });
      item.trace.setAttribute('d', path.trim());
      item.point.setAttribute('cx', current.x.toFixed(2));
      item.point.setAttribute('cy', current.y.toFixed(2));
      const [dx, dy] = offsets[LABELS[index]];
      item.label.setAttribute('x', (current.x + dx).toFixed(2));
      item.label.setAttribute('y', (current.y + dy).toFixed(2));
      item.label.setAttribute('fill', DATA[index].y === 0 ? COLORS.orange : COLORS.limeDeep);
    });

    separator.setAttribute('visibility', state.accuracy === 1 ? 'visible' : 'hidden');
  }

  // ---------------------------------------------------------
  // Loss chart
  // ---------------------------------------------------------
  function initLossChart() {
    const svg = refs.lossChart;
    svg.replaceChildren();
    svg.append(svgElement('desc', {}, '二元交叉熵损失随 epoch 下降。'));
    const plot = { x: 58, y: 26, w: 638, h: 218 };
    const yMax = 0.62;

    // Horizontal grid.
    [0, 0.2, 0.4, 0.6].forEach((tick) => {
      const y = plot.y + plot.h - (tick / yMax) * plot.h;
      append(svg,
        svgElement('line', { x1: plot.x, y1: y, x2: plot.x + plot.w, y2: y, class: 'chart-grid' }),
        svgElement('text', { x: plot.x - 9, y: y + 3, class: 'chart-text', 'text-anchor': 'end' }, tick.toFixed(1))
      );
    });
    // X-axis ticks.
    [0, 100, 200, 300].forEach((tick) => {
      const x = plot.x + (tick / TOTAL_EPOCHS) * plot.w;
      append(svg,
        svgElement('line', { x1: x, y1: plot.y + plot.h, x2: x, y2: plot.y + plot.h + 5, class: 'chart-axis' }),
        svgElement('text', { x, y: plot.y + plot.h + 20, class: 'chart-text', 'text-anchor': 'middle' }, String(tick))
      );
    });
    append(svg,
      svgElement('text', { x: plot.x, y: plot.y - 10, class: 'chart-text' }, 'BCE'),
      svgElement('text', { x: plot.x + plot.w, y: plot.y + plot.h + 36, class: 'chart-text', 'text-anchor': 'end' }, 'EPOCH')
    );

    const area = svgElement('path', { class: 'chart-loss-area' });
    const line = svgElement('path', { class: 'chart-loss-line' });
    const cursorLine = svgElement('line', { class: 'chart-loss-cursor', y1: plot.y, y2: plot.y + plot.h });
    const dot = svgElement('circle', { class: 'chart-loss-dot', r: 3.5 });
    append(svg, area, line, cursorLine, dot);
    refs.loss = { plot, yMax, area, line, cursorLine, dot };
  }

  function renderLoss(state) {
    const { plot, yMax, area, line, cursorLine, dot } = refs.loss;
    const points = history.slice(0, state.epoch + 1).map((entry) => ({
      x: plot.x + (entry.epoch / TOTAL_EPOCHS) * plot.w,
      y: plot.y + plot.h - (entry.loss / yMax) * plot.h
    }));

    let path = '';
    points.forEach((point, index) => {
      path += `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)} `;
    });
    const last = points[points.length - 1];
    const first = points[0];
    line.setAttribute('d', path.trim());
    area.setAttribute('d', `${path} L${last.x.toFixed(2)},${plot.y + plot.h} L${first.x.toFixed(2)},${plot.y + plot.h} Z`);
    cursorLine.setAttribute('x1', last.x.toFixed(2));
    cursorLine.setAttribute('x2', last.x.toFixed(2));
    dot.setAttribute('cx', last.x.toFixed(2));
    dot.setAttribute('cy', last.y.toFixed(2));
  }

  // ---------------------------------------------------------
  // Parameter traces
  // ---------------------------------------------------------
  const PARAM_CHARTS = [
    {
      svg: 'chart-w', legend: 'legend-w',
      series: [
        { name: 'w11', index: 0, color: '#6f8c00' },
        { name: 'w12', index: 1, color: '#d54d25' },
        { name: 'w21', index: 2, color: '#5b68c7' },
        { name: 'w22', index: 3, color: '#10110d' }
      ]
    },
    {
      svg: 'chart-bh', legend: 'legend-bh',
      series: [
        { name: 'bh1', index: 4, color: '#6f8c00' },
        { name: 'bh2', index: 5, color: '#d54d25' }
      ]
    },
    {
      svg: 'chart-out', legend: 'legend-out',
      series: [
        { name: 'v1', index: 6, color: '#6f8c00' },
        { name: 'v2', index: 7, color: '#d54d25' },
        { name: 'bo', index: 8, color: '#5b68c7' }
      ]
    }
  ];

  function initParamCharts() {
    refs.paramCharts = PARAM_CHARTS.map((config) => {
      const svg = document.getElementById(config.svg);
      const legend = document.getElementById(config.legend);
      svg.replaceChildren();
      legend.replaceChildren();

      const plot = { x: 30, y: 15, w: 338, h: 112 };
      const values = config.series.flatMap((series) =>
        history.map((state) => state.theta[series.index])
      );
      let min = Math.min(...values);
      let max = Math.max(...values);
      const padding = (max - min) * 0.12 || 0.2;
      min -= padding;
      max += padding;
      if (min > 0) min = 0;
      if (max < 0) max = 0;

      svg.append(svgElement('desc', {}, `${config.svg} 参数轨迹图。`));
      // Zero line.
      if (min <= 0 && max >= 0) {
        const zeroY = plot.y + plot.h - ((0 - min) / (max - min)) * plot.h;
        svg.append(svgElement('line', {
          x1: plot.x, y1: zeroY, x2: plot.x + plot.w, y2: zeroY,
          stroke: 'rgba(16, 17, 13, 0.22)', 'stroke-width': 1, 'stroke-dasharray': '3 4'
        }));
      }
      [0, 300].forEach((tick, index) => {
        const x = plot.x + (tick / TOTAL_EPOCHS) * plot.w;
        svg.append(svgElement('text', {
          x, y: plot.y + plot.h + 23,
          class: 'chart-text', 'text-anchor': index === 0 ? 'start' : 'end'
        }, String(tick)));
      });

      const paths = config.series.map((series) => {
        const path = svgElement('path', {
          fill: 'none', stroke: series.color, 'stroke-width': 1.6,
          'stroke-linecap': 'round', 'stroke-linejoin': 'round'
        });
        const dot = svgElement('circle', {
          r: 2.8, fill: series.color, stroke: COLORS.paper2, 'stroke-width': 1
        });
        const legendItem = document.createElement('span');
        const value = document.createElement('b');
        const label = document.createElement('em');
        const key = document.createElement('i');
        key.style.background = series.color;
        label.append(key, series.name);
        legendItem.append(label, value);
        legend.append(legendItem);
        svg.append(path, dot);
        return { path, dot, value };
      });

      return { config, svg, legend, plot, min, max, paths };
    });
  }

  function renderParamCharts(state) {
    refs.paramCharts.forEach((chart) => {
      const { plot, min, max, paths } = chart;
      chart.config.series.forEach((series, seriesIndex) => {
        const item = paths[seriesIndex];
        const points = history.slice(0, state.epoch + 1).map((entry) => ({
          x: plot.x + (entry.epoch / TOTAL_EPOCHS) * plot.w,
          y: plot.y + plot.h - ((entry.theta[series.index] - min) / (max - min)) * plot.h
        }));
        let path = '';
        points.forEach((point, index) => {
          path += `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)} `;
        });
        item.path.setAttribute('d', path.trim());
        const current = points[points.length - 1];
        item.dot.setAttribute('cx', current.x.toFixed(2));
        item.dot.setAttribute('cy', current.y.toFixed(2));
        item.value.textContent = fmt(state.theta[series.index], 3);
      });
    });
  }

  // ---------------------------------------------------------
  // UI / playback
  // ---------------------------------------------------------
  function setStatus() {
    let label = '准备就绪';
    let stateClass = '';

    if (playing) {
      label = '训练中';
      stateClass = 'is-live';
    } else if (cursor === TOTAL_EPOCHS) {
      label = '训练完成';
      stateClass = 'is-done';
    } else if (cursor > 0) {
      label = '已暂停';
    }

    refs.statusLabel.textContent = label;
    refs.statusDot.className = `lab-status-dot ${stateClass}`.trim();
  }

  function setPlayButton() {
    refs.playIcon.textContent = playing ? 'Ⅱ' : '▶';
    if (playing) {
      refs.playLabel.textContent = '暂停';
    } else if (cursor === TOTAL_EPOCHS) {
      refs.playLabel.textContent = '重新播放';
    } else if (cursor > 0) {
      refs.playLabel.textContent = '继续训练';
    } else {
      refs.playLabel.textContent = '播放训练';
    }
    refs.playBtn.setAttribute('aria-pressed', String(playing));
  }

  function stopPlaying() {
    playing = false;
    if (playTimer) {
      window.clearInterval(playTimer);
      playTimer = null;
    }
    setPlayButton();
    setStatus();
  }

  function startPlaying() {
    if (cursor >= TOTAL_EPOCHS) setCursor(0);
    playing = true;
    if (playTimer) window.clearInterval(playTimer);
    playTimer = window.setInterval(() => {
      if (cursor >= TOTAL_EPOCHS) {
        stopPlaying();
        return;
      }
      setCursor(cursor + 1);
    }, 32);
    setPlayButton();
    setStatus();
  }

  function togglePlaying() {
    if (playing) stopPlaying();
    else startPlaying();
  }

  function setCursor(nextCursor) {
    cursor = clamp(Math.floor(nextCursor), 0, TOTAL_EPOCHS);
    const state = history[cursor];
    refs.epochRange.value = String(cursor);
    updateNetwork(state);
    updateParams(state);
    updateMetrics(state);
    updateOutputs(state);
    renderBoundary(state);
    renderHidden(state);
    renderLoss(state);
    renderParamCharts(state);
    setPlayButton();
    if (!playing) setStatus();
  }

  function resetTraining(nextLearningRate = learningRate) {
    stopPlaying();
    learningRate = nextLearningRate;
    history = train(learningRate);
    cursor = 0;
    initParamCharts();
    setCursor(0);
    setStatus();
  }

  // ---------------------------------------------------------
  // Code copy
  // ---------------------------------------------------------
  function fallbackCopy(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    document.body.append(area);
    area.select();
    area.setSelectionRange(0, text.length);
    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    }
    area.remove();
    return copied;
  }

  async function copyCode() {
    const code = $('#code-sample')?.textContent ?? '';
    let copied = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(code);
        copied = true;
      } catch {
        copied = fallbackCopy(code);
      }
    } else {
      copied = fallbackCopy(code);
    }

    const button = $('#copy-code');
    const original = button.textContent;
    button.textContent = copied ? '已复制' : '请手动选择';
    window.setTimeout(() => {
      button.textContent = original;
    }, 2200);
  }

  // ---------------------------------------------------------
  // Init
  // ---------------------------------------------------------
  function init() {
    refs = {
      network: $('#network-svg'),
      hiddenChart: $('#hidden-chart'),
      lossChart: $('#loss-chart'),
      playBtn: $('#play-btn'),
      playLabel: $('#play-label'),
      playIcon: $('#play-icon'),
      stepBtn: $('#step-btn'),
      finishBtn: $('#finish-btn'),
      resetBtn: $('#reset-btn'),
      lrSelect: $('#lr-select'),
      epochRange: $('#epoch-range'),
      epochReadout: $('#epoch-readout'),
      statusLabel: $('#status-label'),
      statusDot: $('#status-dot'),
      metricEpoch: $('#metric-epoch'),
      metricLoss: $('#metric-loss'),
      metricAcc: $('#metric-acc'),
      metricLr: $('#metric-lr'),
      lossCurrent: $('#loss-current'),
      outputRows: $$('.output-table tbody tr'),
      outputBars: $$('.output-bar'),
      copyCode: $('#copy-code')
    };

    history = train(learningRate);
    initNetwork();
    initBoundary();
    initHiddenChart();
    initLossChart();
    initParamCharts();

    refs.playBtn.addEventListener('click', togglePlaying);
    refs.stepBtn.addEventListener('click', () => {
      stopPlaying();
      setCursor(cursor + 1);
    });
    refs.finishBtn.addEventListener('click', () => {
      stopPlaying();
      setCursor(TOTAL_EPOCHS);
    });
    refs.resetBtn.addEventListener('click', () => {
      stopPlaying();
      setCursor(0);
    });
    refs.lrSelect.addEventListener('change', () => {
      resetTraining(Number(refs.lrSelect.value));
    });
    refs.epochRange.addEventListener('input', () => {
      stopPlaying();
      setCursor(Number(refs.epochRange.value));
    });
    refs.epochRange.addEventListener('pointerdown', () => {
      if (playing) stopPlaying();
    });
    refs.copyCode?.addEventListener('click', copyCode);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && playing) stopPlaying();
    });

    setCursor(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
