export class QueueNode {
  constructor(priority) {
    this.priority = priority;
  }
}

export class PriorityQueue {
  constructor() {
    this.elements = [];
  }

  // helper method that swaps the elements and two indexes of an array
  swap(index1, index2) {
    const temp = this.elements[index1];
    this.elements[index1] = this.elements[index2];
    this.elements[index2] = temp;
    return this.elements;
  }
  // helper methods that bubbles up elements from end
  bubbleUp() {
    // get index of inserted element
    let index = this.elements.length - 1;
    // loop while index is not 0 or element no loger needs to bubble
    while (index > 0) {
      // get parent index via formula
      const parentIndex = Math.floor((index - 1) / 2);
      // if elements is greater than parent, swap the two
      if (this.elements[parentIndex].priority > this.elements[index].priority) {
        // swap with helper method
        this.swap(index, parentIndex);
        // change current index to parent index
        index = parentIndex;
      } else {
        break;
      }
    }
    return 0;
  }
  // method that pushes new value onto the end and calls the bubble helper
  enqueue(value) {
    this.elements.push(value);
    // calculate parent, if parent is greater swap
    // while loop or recurse
    this.bubbleUp();
    return this.elements;
  }

  bubbleDown() {
    let parentIndex = 0;
    const length = this.elements.length;
    const elementPriority = this.elements[0].priority;
    // loop breaks if no swaps are needed
    while (true) {
      // get indexes of child elements by following formula
      const leftChildIndex = (2 * parentIndex) + 1;
      const rightChildIndex = (2 * parentIndex) + 2;
      let leftChildPriority; let rightChildPriority;
      let indexToSwap = null;
      // if left child exists, and is greater than the element, plan to swap with the left child index
      if (leftChildIndex < length) {
        leftChildPriority = this.elements[leftChildIndex].priority;
        if (leftChildPriority < elementPriority) {
          indexToSwap = leftChildIndex;
        }
      }
      // if right child exists
      if (rightChildIndex < length) {
        rightChildPriority = this.elements[rightChildIndex].priority;

        if (
        // if right child is greater than element and there are no plans to swap
          (rightChildPriority < elementPriority && indexToSwap === null) ||
                    // OR if right child is greater than left child and there ARE plans to swap
                    (rightChildPriority < leftChildPriority && indexToSwap !== null)) {
          // plan to swap with the right child
          indexToSwap = rightChildIndex;
        }
      }
      // if there are no plans to swap, break out of the loop
      if (indexToSwap === null) {
        break;
      }
      // swap with planned element
      this.swap(parentIndex, indexToSwap);
      // starting index is now index that we swapped with
      parentIndex = indexToSwap;
    }
  }

  dequeue() {
    // swap first and last element
    this.swap(0, this.elements.length - 1);
    // pop max value off of elements
    const poppedNode = this.elements.pop();
    // re-adjust heap if length is greater than 1
    if (this.elements.length > 1) {
      this.bubbleDown();
    }

    return poppedNode;
  }

  peak() {
    return this.elements[0];
  }
}