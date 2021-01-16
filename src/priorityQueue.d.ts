export interface QueueNode {
    priority: number;
}

export class PriorityQueue<T extends QueueNode> {
    constructor();

    elements: T[];

    swap(index1: number, index2: number): void;

    enqueue(value: T): T;

    dequeue(): T;

    peak(): T;
}