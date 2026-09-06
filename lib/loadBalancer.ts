export type LoadBalanceStrategy = 'round-robin' | 'least-connections' | 'weighted';

export interface McpNode {
  id: string;
  name: string;
  role: 'primary' | 'worker' | 'edge';
  weight: number;                // 1-10 priority weighting
  activeConnections: number;     // Currently processing in-flight tasks
  totalRequestsServed: number;
  consecutiveFailures: number;
  status: 'healthy' | 'degraded' | 'offline';
  avgLatencyMs: number;
}

export interface ClusterSnapshot {
  activeStrategy: LoadBalanceStrategy;
  totalNodes: number;
  healthyNodes: number;
  totalRequestsProcessed: number;
  nodes: McpNode[];
}

class McpLoadBalancer {
  private nodes: McpNode[] = [
    {
      id: 'mcp-node-core-01',
      name: 'LOCAL RUNTIME (CORE WORKER)',
      role: 'primary',
      weight: 5,
      activeConnections: 0,
      totalRequestsServed: 0,
      consecutiveFailures: 0,
      status: 'healthy',
      avgLatencyMs: 12,
    },
    {
      id: 'mcp-node-edge-02',
      name: 'CLIENT IN-MEMORY WORKER',
      role: 'edge',
      weight: 4,
      activeConnections: 0,
      totalRequestsServed: 0,
      consecutiveFailures: 0,
      status: 'healthy',
      avgLatencyMs: 18,
    },
    {
      id: 'mcp-node-stream-03',
      name: 'MEDIASTREAM PIPELINE WORKER',
      role: 'worker',
      weight: 3,
      activeConnections: 0,
      totalRequestsServed: 0,
      consecutiveFailures: 0,
      status: 'healthy',
      avgLatencyMs: 25,
    },
  ];

  private currentIndex: number = 0;
  private defaultStrategy: LoadBalanceStrategy = 'least-connections';

  public getHealthyNodes(): McpNode[] {
    const healthy = this.nodes.filter((n) => n.status !== 'offline');
    return healthy.length > 0 ? healthy : [this.nodes[0]];
  }

  /**
   * Dispatches the next request to an optimal node according to the configured algorithm
   */
  public acquireNode(strategy: LoadBalanceStrategy = this.defaultStrategy): McpNode {
    const available = this.getHealthyNodes();
    let selected: McpNode;

    switch (strategy) {
      case 'least-connections': {
        // Select node with the lowest in-flight connections
        selected = available.reduce((minNode, currNode) =>
          currNode.activeConnections < minNode.activeConnections ? currNode : minNode
        );
        break;
      }

      case 'weighted': {
        // Weighted random selection
        const totalWeight = available.reduce((acc, n) => acc + n.weight, 0);
        let randomWeight = Math.random() * totalWeight;
        selected = available[0];

        for (const node of available) {
          randomWeight -= node.weight;
          if (randomWeight <= 0) {
            selected = node;
            break;
          }
        }
        break;
      }

      case 'round-robin':
      default: {
        // Sequential fair round-robin
        selected = available[this.currentIndex % available.length];
        this.currentIndex = (this.currentIndex + 1) % available.length;
        break;
      }
    }

    selected.activeConnections += 1;
    selected.totalRequestsServed += 1;
    return selected;
  }

  /**
   * Releases in-flight connection lock and records latency/circuit telemetry
   */
  public releaseNode(nodeId: string, success: boolean, durationMs: number = 10): void {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    node.activeConnections = Math.max(0, node.activeConnections - 1);

    if (success) {
      node.consecutiveFailures = 0;
      // Exponential moving average for latency
      node.avgLatencyMs = Math.round(node.avgLatencyMs * 0.8 + durationMs * 0.2);
      if (node.status === 'degraded') {
        node.status = 'healthy';
      }
    } else {
      node.consecutiveFailures += 1;
      // Circuit breaker threshold
      if (node.consecutiveFailures >= 3 && node.role !== 'primary') {
        node.status = 'degraded';
      }
      if (node.consecutiveFailures >= 5 && node.role !== 'primary') {
        node.status = 'offline';
      }
    }
  }

  /**
   * Snapshot metrics for cluster telemetry
   */
  public getClusterSnapshot(): ClusterSnapshot {
    const totalRequests = this.nodes.reduce((sum, n) => sum + n.totalRequestsServed, 0);
    const healthyCount = this.nodes.filter((n) => n.status === 'healthy').length;

    return {
      activeStrategy: this.defaultStrategy,
      totalNodes: this.nodes.length,
      healthyNodes: healthyCount,
      totalRequestsProcessed: totalRequests,
      nodes: this.nodes.map((n) => ({ ...n })),
    };
  }

  public setStrategy(strategy: LoadBalanceStrategy) {
    this.defaultStrategy = strategy;
  }
}

// Export singleton instance
export const mcpLoadBalancer = new McpLoadBalancer();
