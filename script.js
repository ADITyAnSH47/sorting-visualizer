let delay = 150; 

const algorithms = ["bubble", "selection", "insertion", "merge", "quick", "heap", "radix"];
const bigOMap = {
  bubble: "O(n²)", selection: "O(n²)", insertion: "O(n²)",
  merge: "O(n log n)", quick: "O(n log n)",
  heap: "O(n log n)", radix: "O(nk)"
};

// Remove: const sleep = ms => new Promise(r => setTimeout(r, ms));
// Replace with:

let isPaused = false;
let stepResolvers = []; // Array to hold multiple promises for concurrent algorithms

function togglePause() {
  isPaused = !isPaused;
  document.getElementById("pauseBtn").innerText = isPaused ? "▶️ Resume" : "⏸️ Pause";
  document.getElementById("stepBtn").disabled = !isPaused;
  
  // If resuming, resolve all waiting promises to unfreeze the visualizer
  if (!isPaused) {
    stepResolvers.forEach(resolve => resolve());
    stepResolvers = [];
  }
}

function stepForward() {
  if (isPaused && stepResolvers.length > 0) {
    // Release the current hold, allowing algorithms to advance one frame
    stepResolvers.forEach(resolve => resolve());
    stepResolvers = [];
  }
}

const sleep = async (ms) => {
  if (isPaused) {
    await new Promise(resolve => stepResolvers.push(resolve));
  } else {
    await new Promise(resolve => setTimeout(resolve, delay));
  }
};
window.addEventListener("DOMContentLoaded", () => {
  fillDropdowns();
  generateArray();
  
  const speedSlider = document.getElementById("speedSlider");
  speedSlider.addEventListener("input", function() {
    delay = (101 - this.value) * 5; 
  });
});

function fillDropdowns() {
  for (let i = 1; i <= 4; i++) {
    let sel = document.getElementById("algo" + i);
    algorithms.forEach(a => {
      let op = document.createElement("option");
      op.value = a; op.text = a.charAt(0).toUpperCase() + a.slice(1);
      sel.appendChild(op);
    });
    if(i <= algorithms.length) sel.selectedIndex = i - 1; 
  }
}

function generateArray() {
  let arr = Array.from({length: 30}, () => Math.floor(Math.random() * 230) + 10);
  renderAll(arr);
}

function useUserArray() {
  let arr = document.getElementById("userArray").value
    .split(",").map(x => parseInt(x.trim())).filter(x => !isNaN(x));
  if (arr.length === 0) { alert("Invalid input"); return; }
  renderAll(arr);
}

function renderAll(arr) {
  for (let i = 1; i <= 4; i++) renderArray("array" + i, [...arr]);
}

function renderArray(id, arr) {
  let c = document.getElementById(id);
  c.innerHTML = "";
  arr.forEach(v => {
    let b = document.createElement("div");
    b.classList.add("bar");
    b.style.height = v + "px";
    
    // Create a span for the text to allow independent CSS rotation
    let textSpan = document.createElement("span");
    textSpan.innerText = v;
    b.appendChild(textSpan);
    
    c.appendChild(b);
  });
}

async function startComparison() {
  let promises = [];
  for (let i = 1; i <= 4; i++) {
    let algo = document.getElementById("algo" + i).value;
    document.getElementById("name" + i).innerText = algo.toUpperCase();
    document.getElementById("bigO" + i).innerText = bigOMap[algo];
    document.getElementById("time" + i).innerText = "Running...";

    let bars = document.querySelectorAll("#array" + i + " .bar");
    if (!bars.length) { alert("Generate array first"); return; }
    let arr = [...bars].map(b => parseInt(b.style.height));
    promises.push(runWithTimer(algo, arr, bars, i));
  }
  await Promise.all(promises);
}

async function runWithTimer(algo, arr, bars, id) {
  let start = performance.now();
  await runAlgo(algo, arr, bars);
  let end = performance.now();
  document.getElementById("time" + id).innerText = (end - start).toFixed(2) + " ms";
  markSorted(bars);
}

async function runAlgo(a, arr, bars) {
  if (a === "bubble") await bubble(arr, bars);
  if (a === "selection") await selection(arr, bars);
  if (a === "insertion") await insertion(arr, bars);
  if (a === "merge") await mergeSort(arr, 0, arr.length - 1, bars);
  if (a === "quick") await quickSort(arr, 0, arr.length - 1, bars);
  if (a === "heap") await heapSort(arr, bars);
  if (a === "radix") await radixSort(arr, bars);
}

function updateBar(bar, val) {
  bar.style.height = val + "px";
  bar.querySelector("span").innerText = val;
}

function color(bars, i, j, cls) {
  if(bars[i]) bars[i].classList.add(cls);
  if(bars[j]) bars[j].classList.add(cls);
}

function reset(bars, i, j) {
  if(bars[i]) bars[i].classList.remove("compare", "swap");
  if(bars[j]) bars[j].classList.remove("compare", "swap");
}

async function markSorted(bars) {
  for (let i = 0; i < bars.length; i++) {
    bars[i].classList.remove("compare", "swap");
    bars[i].classList.add("sorted");
    await sleep(10); 
  }
}

/* --- ALGORITHMS --- */

async function bubble(arr, bars) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      color(bars, j, j + 1, "compare");
      await sleep(delay);
      if (arr[j] > arr[j + 1]) {
        color(bars, j, j + 1, "swap");
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        updateBar(bars[j], arr[j]);
        updateBar(bars[j+1], arr[j+1]);
        await sleep(delay);
      }
      reset(bars, j, j + 1);
    }
  }
}

async function selection(arr, bars) {
  for (let i = 0; i < arr.length; i++) {
    let min = i;
    for (let j = i + 1; j < arr.length; j++) {
      color(bars, min, j, "compare");
      await sleep(delay);
      if (arr[j] < arr[min]) {
        reset(bars, min, min); 
        min = j;
        color(bars, min, min, "swap");
      } else {
        reset(bars, j, j);
      }
    }
    [arr[i], arr[min]] = [arr[min], arr[i]];
    updateBar(bars[i], arr[i]);
    updateBar(bars[min], arr[min]);
    reset(bars, i, min);
  }
}

async function insertion(arr, bars) {
  for (let i = 1; i < arr.length; i++) {
    let key = arr[i], j = i - 1;
    while (j >= 0 && arr[j] > key) {
      color(bars, j, j + 1, "swap");
      arr[j + 1] = arr[j];
      updateBar(bars[j+1], arr[j+1]);
      await sleep(delay);
      reset(bars, j, j + 1);
      j--;
    }
    arr[j + 1] = key;
    updateBar(bars[j+1], arr[j+1]);
  }
}

async function mergeSort(arr, start, end, bars) {
  if (start >= end) return;
  let mid = Math.floor((start + end) / 2);
  await mergeSort(arr, start, mid, bars);
  await mergeSort(arr, mid + 1, end, bars);
  await merge(arr, start, mid, end, bars);
}

async function merge(arr, start, mid, end, bars) {
  let left = arr.slice(start, mid + 1);
  let right = arr.slice(mid + 1, end + 1);
  let i = 0, j = 0, k = start;

  while (i < left.length && j < right.length) {
    color(bars, k, k, "compare");
    await sleep(delay);
    if (left[i] <= right[j]) { arr[k] = left[i]; i++; } 
    else { arr[k] = right[j]; j++; }
    updateBar(bars[k], arr[k]);
    reset(bars, k, k);
    k++;
  }
  while (i < left.length) {
    color(bars, k, k, "compare");
    await sleep(delay);
    arr[k] = left[i];
    updateBar(bars[k], arr[k]);
    reset(bars, k, k);
    i++; k++;
  }
  while (j < right.length) {
    color(bars, k, k, "compare");
    await sleep(delay);
    arr[k] = right[j];
    updateBar(bars[k], arr[k]);
    reset(bars, k, k);
    j++; k++;
  }
}

async function quickSort(arr, low, high, bars) {
  if (low < high) {
    let pi = await partition(arr, low, high, bars);
    await quickSort(arr, low, pi - 1, bars);
    await quickSort(arr, pi + 1, high, bars);
  }
}

async function partition(arr, low, high, bars) {
  let pivot = arr[high];
  color(bars, high, high, "compare"); 
  let i = low - 1;
  for (let j = low; j < high; j++) {
    color(bars, j, j, "compare");
    await sleep(delay);
    if (arr[j] < pivot) {
      i++;
      color(bars, i, j, "swap");
      [arr[i], arr[j]] = [arr[j], arr[i]];
      updateBar(bars[i], arr[i]);
      updateBar(bars[j], arr[j]);
      await sleep(delay);
      reset(bars, i, j);
    } else {
      reset(bars, j, j);
    }
  }
  color(bars, i + 1, high, "swap");
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  updateBar(bars[i+1], arr[i+1]);
  updateBar(bars[high], arr[high]);
  await sleep(delay);
  reset(bars, i + 1, high);
  reset(bars, high, high);
  return i + 1;
}

async function heapSort(arr, bars) {
  let n = arr.length;
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) await heapify(arr, n, i, bars);
  for (let i = n - 1; i > 0; i--) {
    color(bars, 0, i, "swap");
    [arr[0], arr[i]] = [arr[i], arr[0]];
    updateBar(bars[0], arr[0]);
    updateBar(bars[i], arr[i]);
    await sleep(delay);
    reset(bars, 0, i);
    await heapify(arr, i, 0, bars);
  }
}

async function heapify(arr, n, i, bars) {
  let largest = i, left = 2 * i + 1, right = 2 * i + 2;
  if (left < n && arr[left] > arr[largest]) largest = left;
  if (right < n && arr[right] > arr[largest]) largest = right;
  
  if (largest !== i) {
    color(bars, i, largest, "swap");
    [arr[i], arr[largest]] = [arr[largest], arr[i]];
    updateBar(bars[i], arr[i]);
    updateBar(bars[largest], arr[largest]);
    await sleep(delay);
    reset(bars, i, largest);
    await heapify(arr, n, largest, bars);
  }
}

async function radixSort(arr, bars) {
  let max = Math.max(...arr);
  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    await countSort(arr, exp, bars);
  }
}

async function countSort(arr, exp, bars) {
  let n = arr.length;
  let output = new Array(n).fill(0);
  let count = new Array(10).fill(0);
  
  for (let i = 0; i < n; i++) count[Math.floor(arr[i] / exp) % 10]++;
  for (let i = 1; i < 10; i++) count[i] += count[i - 1];
  for (let i = n - 1; i >= 0; i--) {
    output[count[Math.floor(arr[i] / exp) % 10] - 1] = arr[i];
    count[Math.floor(arr[i] / exp) % 10]--;
  }
  for (let i = 0; i < n; i++) {
    color(bars, i, i, "swap");
    await sleep(delay);
    arr[i] = output[i];
    updateBar(bars[i], arr[i]);
    reset(bars, i, i);
  }
}