const WORKS_DATABASE = {
  'work_001': {
    id: 'work_001',
    title: '秦宫诗',
    author: '未知',
    dynasty: '清代',
    style: '行书',
    imagePath: '/static/images/test.webp',
    imageWidth: 800,
    imageHeight: 801,
    timestamp: '2024-01-15T10:30:00Z',
    description: '春锁阿房静管弦，巷生舞袖为谁妍...',
    ocrData: {
      "height": 801,
      "width": 800,
      "text_lines": [
        {
          "text": "春鎖阿房静管弦",
          "words": [
            { "text": "春", "position": [570, 100, 640, 175] },
            { "text": "鎖", "position": [566, 192, 637, 263] },
            { "text": "阿", "position": [577, 276, 643, 336] },
            { "text": "房", "position": [578, 358, 637, 440] },
            { "text": "静", "position": [575, 453, 644, 546] },
            { "text": "管", "position": [585, 556, 644, 634] },
            { "text": "弦", "position": [587, 652, 649, 717] }
          ]
        },
        {
          "text": "巷生舞袖為谁妍",
          "words": [
            { "text": "巷", "position": [456, 106, 521, 191] },
            { "text": "生", "position": [461, 202, 517, 270] },
            { "text": "舞", "position": [462, 289, 535, 402] },
            { "text": "袖", "position": [460, 427, 536, 489] },
            { "text": "為", "position": [467, 507, 533, 591] },
            { "text": "谁", "position": [460, 615, 536, 700] },
            { "text": "妍", "position": [359, 110, 432, 196] }
          ]
        },
        {
          "text": "従来不識君",
          "words": [
            { "text": "従", "position": [365, 206, 438, 270] },
            { "text": "来", "position": [361, 287, 431, 374] },
            { "text": "不", "position": [359, 399, 433, 463] },
            { "text": "識", "position": [357, 496, 440, 582] },
            { "text": "君", "position": [366, 614, 418, 689] }
          ]
        },
        {
          "text": "王面忽遏人间卅六年",
          "words": [
            { "text": "王", "position": [262, 111, 305, 168] },
            { "text": "面", "position": [256, 182, 318, 246] },
            { "text": "忽", "position": [259, 263, 317, 334] },
            { "text": "遏", "position": [251, 356, 316, 433] },
            { "text": "人", "position": [250, 453, 331, 520] },
            { "text": "间", "position": [248, 544, 315, 621] },
            { "text": "卅", "position": [247, 642, 323, 699] },
            { "text": "六", "position": [151, 115, 215, 171] },
            { "text": "年", "position": [151, 186, 218, 297] }
          ]
        },
        {
          "text": "右秦宫",
          "words": [
            { "text": "右", "position": [167, 338, 211, 377] },
            { "text": "秦", "position": [171, 385, 217, 432] },
            { "text": "宫", "position": [170, 445, 212, 490] }
          ]
        }
      ]
    }
  },
  'work_002': {
    id: 'work_002',
    title: '兰亭集序',
    author: '王羲之',
    dynasty: '东晋',
    style: '行书',
    imagePath: '/static/images/lantingxu.jpg',
    imageWidth: 1200,
    imageHeight: 800,
    timestamp: '2024-01-20T14:20:00Z',
    description: '永和九年，岁在癸丑...',
    ocrData: { "height": 800, "width": 1200, "text_lines": [] }
  }
};

const DEFAULT_WORK_ID = 'work_001';

function getWorkData(workId) {
  return WORKS_DATABASE[workId] || WORKS_DATABASE[DEFAULT_WORK_ID];
}

function getAllWorks() {
  return Object.values(WORKS_DATABASE);
}

function convertOcrToBoxes(ocrData) {
  const boxes = [];
  let boxId = 0;
  if (ocrData && ocrData.text_lines) {
    const allWords = ocrData.text_lines.flatMap(line => line.words || []);
    allWords.sort((a, b) => {
      const aCenter = a.position[0] + (a.position[2] - a.position[0]) / 2;
      const bCenter = b.position[0] + (b.position[2] - b.position[0]) / 2;
      if (Math.abs(bCenter - aCenter) < 50) return a.position[1] - b.position[1];
      return bCenter - aCenter;
    });
    allWords.forEach(word => {
      const [x_min, y_min, x_max, y_max] = word.position;
      boxes.push({
        id: boxId++,
        x: x_min,
        y: y_min,
        width: x_max - x_min,
        height: y_max - y_min,
        char: word.text
      });
    });
  }
  return boxes;
}