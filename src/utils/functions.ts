export function getObjectFromLocalStorage(key: string) {
  try {
    const string = localStorage.getItem(key) as string;
    const object = JSON.parse(string);
    return object;
  } catch (e) {
    return null;
  }
}

export function bubbleSortObject(arr: any[], key: string | number) {
  for (let i = 0; i < arr.length; i++) {
    // Last i elements are already in place
    for (let j = 0; j < arr.length - i - 1; j++) {
      // Checking if the item at present iteration
      // is greater than the next iteration
      if (arr[j][key] > arr[j + 1][key]) {
        // If the condition is true
        // then swap them
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }

  return arr;
}
