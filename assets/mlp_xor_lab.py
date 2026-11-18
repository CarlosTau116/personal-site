#!/usr/bin/env python3
"""
MLP learning parameters on XOR
==============================

A from-scratch NumPy implementation of the 2-2-1 network used in the
course slide "15 / 人工神经元网络".

Architecture:
    2 inputs -> 2 sigmoid hidden units -> 1 sigmoid output (logit)

Training:
    XOR (4 samples), full batch, binary cross-entropy with logits,
    Adam (lr=0.03, beta1=0.9, beta2=0.999, eps=1e-8), 300 epochs.

Initialisation follows the course example:
    W  = [[ 2., -2.],
          [-2.,  2.]]
    bh = [-1., -1.]
    v  = [[ 3.], [ 3.]]
    bo = [-2.5]

The script prints the final probabilities and parameter values, and writes
a 2x2 figure with:
    1. loss curve
    2. decision boundary on the XOR input plane
    3. hidden-representation trajectories
    4. parameter trajectories

Run:
    python -m pip install numpy matplotlib
    python mlp_xor_lab.py

Optional:
    python mlp_xor_lab.py --epochs 300 --lr 0.03 --no-plot
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass

import numpy as np


X = np.array([[0.0, 0.0], [0.0, 1.0], [1.0, 0.0], [1.0, 1.0]])
Y = np.array([[0.0], [1.0], [1.0], [0.0]])

THETA_INITIAL = np.array(
    [
        2.0, -2.0, -2.0, 2.0,   # W: [w11, w12, w21, w22]
        -1.0, -1.0,             # hidden biases
        3.0, 3.0,               # output weights
        -2.5,                   # output bias
    ],
    dtype=np.float64,
)


@dataclass
class State:
    epoch: int
    theta: np.ndarray
    hidden: np.ndarray
    probs: np.ndarray
    loss: float
    prediction: np.ndarray

    @property
    def accuracy(self) -> float:
        return float(np.mean(self.prediction == Y.ravel()))


def sigmoid(z: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-z))


def unpack(theta: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    w = theta[0:4].reshape(2, 2)
    bh = theta[4:6]
    v = theta[6:8].reshape(2, 1)
    bo = np.array([theta[8]])
    return w, bh, v, bo


def forward(theta: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    w, bh, v, bo = unpack(theta)
    hidden = sigmoid(X @ w + bh)
    logits = hidden @ v + bo
    probs = sigmoid(logits).ravel()
    return hidden, logits.ravel(), probs


def bce_with_logits(logits: np.ndarray, targets: np.ndarray) -> float:
    # Stable binary cross-entropy: max(z, 0) - z*y + log(1 + exp(-|z|))
    losses = np.maximum(logits, 0.0) - logits * targets + np.log1p(np.exp(-np.abs(logits)))
    return float(np.mean(losses))


def loss_and_gradients(theta: np.ndarray) -> tuple[float, np.ndarray]:
    """Return BCE loss and the gradient with respect to the 9 parameters."""
    w, bh, v, bo = unpack(theta)
    hidden, logits, probs = forward(theta)
    loss = bce_with_logits(logits, Y.ravel())

    # Mean loss over four samples.
    dlogits = (probs.reshape(-1, 1) - Y) / len(X)
    dv = hidden.T @ dlogits
    dbo = np.sum(dlogits, axis=0)

    dhidden = dlogits @ v.T
    dpre = dhidden * hidden * (1.0 - hidden)
    dw = X.T @ dpre
    dbh = np.sum(dpre, axis=0)

    grad = np.concatenate([dw.ravel(), dbh.ravel(), dv.ravel(), dbo.ravel()])
    return loss, grad


def make_state(epoch: int, theta: np.ndarray) -> State:
    hidden, logits, probs = forward(theta)
    loss = bce_with_logits(logits, Y.ravel())
    prediction = (probs >= 0.5).astype(int)
    return State(epoch, theta.copy(), hidden.copy(), probs.copy(), loss, prediction)


def train(lr: float = 0.03, epochs: int = 300) -> list[State]:
    """Train from the course initialisation and record every epoch."""
    theta = THETA_INITIAL.copy()
    history = [make_state(0, theta)]

    m = np.zeros_like(theta)
    s = np.zeros_like(theta)
    beta1, beta2, eps = 0.9, 0.999, 1e-8

    for epoch in range(1, epochs + 1):
        _, grad = loss_and_gradients(theta)

        # Adam per scalar parameter.
        m = beta1 * m + (1.0 - beta1) * grad
        s = beta2 * s + (1.0 - beta2) * (grad * grad)
        m_hat = m / (1.0 - beta1**epoch)
        s_hat = s / (1.0 - beta2**epoch)
        theta -= lr * m_hat / (np.sqrt(s_hat) + eps)

        history.append(make_state(epoch, theta))

    return history


def print_summary(history: list[State]) -> None:
    start, end = history[0], history[-1]
    w, bh, v, bo = unpack(end.theta)

    print("MLP / XOR / 2-2-1")
    print(f"epochs: {end.epoch}    lr: 0.03    parameters: 9")
    print()
    print(f"initial loss: {start.loss:.6f}    initial probs: {np.round(start.probs, 4).tolist()}")
    print(f"final   loss: {end.loss:.6f}    final   probs: {np.round(end.probs, 4).tolist()}")
    print(f"final predictions: {end.prediction.tolist()}    accuracy: {end.accuracy:.0%}")
    print()
    print("final parameters")
    print(f"W  =\n{w}")
    print(f"bh = {bh}")
    print(f"v  = {v.ravel()}")
    print(f"bo = {bo}")


def plot_history(history: list[State], output: str = "mlp_xor_lab.png") -> None:
    """Create a four-panel visual report for the experiment."""
    import matplotlib.pyplot as plt

    plt.rcParams.update(
        {
            "figure.facecolor": "#f2f0e8",
            "axes.facecolor": "#faf8f1",
            "axes.edgecolor": "#10110d",
            "text.color": "#10110d",
            "axes.labelcolor": "#10110d",
            "xtick.color": "#6f7166",
            "ytick.color": "#6f7166",
            "font.size": 9,
        }
    )

    fig, axes = plt.subplots(2, 2, figsize=(12, 9.5), constrained_layout=True)
    fig.suptitle("MLP / XOR / learning parameters", fontsize=16, fontweight="bold", x=0.03, ha="left")

    epochs = np.array([state.epoch for state in history])
    losses = np.array([state.loss for state in history])
    thetas = np.array([state.theta for state in history])
    hidden = np.array([state.hidden for state in history])

    # 1. Loss
    ax = axes[0, 0]
    ax.plot(epochs, losses, color="#6f8c00", linewidth=2.2)
    ax.fill_between(epochs, losses, color="#d8ff3e", alpha=0.24)
    ax.scatter([epochs[-1]], [losses[-1]], color="#ff6a3d", zorder=3, s=28)
    ax.annotate(
        f"{losses[-1]:.4f}",
        (epochs[-1], losses[-1]),
        xytext=(-8, 14),
        textcoords="offset points",
        ha="right",
        fontsize=9,
        color="#ff6a3d",
    )
    ax.set_title("BCE loss", loc="left", fontweight="bold")
    ax.set_xlabel("epoch")
    ax.set_ylabel("loss")
    ax.grid(axis="y", color="#10110d", alpha=0.08)
    ax.spines[["top", "right"]].set_visible(False)

    # 2. Decision boundary
    ax = axes[0, 1]
    grid = np.linspace(-0.15, 1.15, 160)
    xx, yy = np.meshgrid(grid, grid)
    points = np.column_stack([xx.ravel(), yy.ravel()])
    w, bh, v, bo = unpack(history[-1].theta)
    hh = sigmoid(points @ w + bh)
    pp = sigmoid(hh @ v + bo).reshape(xx.shape)
    ax.contourf(xx, yy, pp, levels=np.linspace(0, 1, 20), cmap="RdYlGn_r", alpha=0.42)
    ax.contour(xx, yy, pp, levels=[0.5], colors="#10110d", linewidths=1.2, linestyles="--")
    for (x1, x2), target in zip(X, Y.ravel()):
        color = "#d54d25" if target == 0 else "#6f8c00"
        ax.scatter(x1, x2, s=130, color=color, edgecolor="#10110d", linewidth=1.1, zorder=3)
        ax.annotate(f"{int(x1)}{int(x2)}", (x1, x2), xytext=(7, 7), textcoords="offset points", fontsize=8)
    ax.set_title("decision boundary / P(y=1)", loc="left", fontweight="bold")
    ax.set_xlabel("x1")
    ax.set_ylabel("x2")
    ax.set_xlim(-0.15, 1.15)
    ax.set_ylim(-0.15, 1.15)
    ax.set_aspect("equal")
    ax.spines[["top", "right"]].set_visible(False)

    # 3. Hidden representation trajectories
    ax = axes[1, 0]
    sample_labels = ["00", "01", "10", "11"]
    sample_colors = ["#d54d25", "#6f8c00", "#6f8c00", "#d54d25"]
    label_offsets = {"00": (8, -11), "01": (8, 8), "10": (-25, 9), "11": (8, 13)}
    for i, label in enumerate(sample_labels):
        ax.plot(
            hidden[:, i, 0],
            hidden[:, i, 1],
            color=sample_colors[i],
            alpha=0.26,
            linewidth=1,
        )
        ax.scatter(
            hidden[-1, i, 0],
            hidden[-1, i, 1],
            color=sample_colors[i],
            edgecolor="#10110d",
            linewidth=1,
            s=62,
            zorder=3,
        )
        ax.annotate(
            label,
            (hidden[-1, i, 0], hidden[-1, i, 1]),
            xytext=label_offsets[label],
            textcoords="offset points",
            fontsize=8,
        )
    ax.set_title("hidden representation / h1-h2", loc="left", fontweight="bold")
    ax.set_xlabel("h1")
    ax.set_ylabel("h2")
    ax.set_xlim(-0.05, 1.05)
    ax.set_ylim(-0.05, 1.05)
    ax.grid(color="#10110d", alpha=0.06)
    ax.spines[["top", "right"]].set_visible(False)

    # 4. Parameter trajectories
    ax = axes[1, 1]
    labels = ["w11", "w12", "w21", "w22", "bh1", "bh2", "v1", "v2", "bo"]
    colors = ["#6f8c00", "#d54d25", "#6c7ee0", "#10110d", "#a3b400", "#e08a62", "#5f6fe0", "#8d9fff", "#77796d"]
    for idx, (label, color) in enumerate(zip(labels, colors)):
        ax.plot(epochs, thetas[:, idx], label=label, color=color, linewidth=1.7)
    ax.axhline(0, color="#10110d", linewidth=0.7, alpha=0.25)
    ax.set_title("parameter trajectories", loc="left", fontweight="bold")
    ax.set_xlabel("epoch")
    ax.set_ylabel("value")
    ax.legend(loc="upper left", ncol=3, fontsize=7, frameon=False)
    ax.grid(axis="y", color="#10110d", alpha=0.08)
    ax.spines[["top", "right"]].set_visible(False)

    fig.savefig(output, dpi=180, bbox_inches="tight")
    print(f"saved figure: {output}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Train a 2-2-1 MLP on XOR and visualise its parameters.")
    parser.add_argument("--lr", type=float, default=0.03)
    parser.add_argument("--epochs", type=int, default=300)
    parser.add_argument("--output", default="mlp_xor_lab.png")
    parser.add_argument("--no-plot", action="store_true")
    args = parser.parse_args()

    history = train(lr=args.lr, epochs=args.epochs)
    print_summary(history)
    if not args.no_plot:
        plot_history(history, output=args.output)


if __name__ == "__main__":
    main()
