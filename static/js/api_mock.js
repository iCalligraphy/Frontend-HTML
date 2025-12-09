// ...existing code...
(function () {
  if (typeof window !== 'undefined' && window.mockAPI) return;

  class MockAPI {
    constructor() { this.initMockData(); }
    initMockData() {
      this.works = [
        { id: 1, title: "兰亭序", style: "行书", dynasty: "东晋", author_name: "王羲之", image_url: "/static/images/test.webp" },
        { id: 2, title: "秦宫诗", style: "楷书", dynasty: "清代", author_name: "未知", image_url: "/static/images/test.webp" }
      ];
      this.characters = [
        { id: 1, text: "永", work_id: 1, position: [570,100,640,175], stroke_count:5, image_url: "/static/images/char_1.png", ocr_confidence:0.98, created_at:"2025-12-03T10:00:00" },
        { id: 2, text: "春", work_id: 2, position: [570,100,640,175], stroke_count:9, image_url: "/static/images/char_2.png", ocr_confidence:0.95, created_at:"2025-12-04T10:00:00" }
      ];
      this.storageKey = "iCalligraphy_my_collection";
      if (!localStorage.getItem(this.storageKey)) localStorage.setItem(this.storageKey, JSON.stringify([]));
    }

    async getWorkCharacters(workId, page = 1, perPage = 50) {
      return new Promise(resolve => {
        setTimeout(() => {
          const workChars = this.characters.filter(c => c.work_id === Number(workId)).map(c => ({...c, work: this.works.find(w=>w.id===c.work_id)}));
          const start = (page-1)*perPage; const end = start+perPage;
          resolve({ code:200, message:"查询成功", data:{ items: workChars.slice(start,end), pagination:{ current_page: page, per_page: perPage, total: workChars.length, total_pages: Math.ceil(workChars.length/perPage) } } });
        }, 200);
      });
    }

    async getCharacterDetail(characterId) {
      return new Promise(resolve => {
        setTimeout(() => {
          const character = this.characters.find(c=>c.id===Number(characterId));
          if (!character) return resolve({ code:404, message:"单字不存在", data:null });
          const work = this.works.find(w=>w.id===character.work_id);
          resolve({ code:200, message:"获取成功", data:{ character:{ ...character, work, annotations: [] } } });
        }, 200);
      });
    }

    async collectCharacter(characterId) {
      return new Promise(resolve => {
        setTimeout(()=> {
          const collection = JSON.parse(localStorage.getItem(this.storageKey) || "[]");
          const exists = collection.some(i => i.character_id === Number(characterId));
          if (exists) return resolve({ code:400, message:"已经收藏过该单字" });
          const char = this.characters.find(c=>c.id===Number(characterId)) || {};
          const work = this.works.find(w=>w.id===char.work_id) || {};
          const newItem = { character_id: Number(characterId), text: char.text||'', work_id: work.id||null, work_title: work.title||'', work_style: work.style||'', position: char.position||null, imageData: null, collected_at: new Date().toISOString() };
          collection.push(newItem);
          localStorage.setItem(this.storageKey, JSON.stringify(collection));
          resolve({ code:201, message:"添加成功", data:newItem });
        }, 200);
      });
    }

    isCollected(characterId) {
      try { const collection = JSON.parse(localStorage.getItem(this.storageKey) || "[]"); return collection.some(i=>Number(i.character_id)===Number(characterId)); }
      catch(e){ return false; }
    }

    collectCharacterWithData(charData) {
      return new Promise(resolve => {
        setTimeout(()=> {
          const collection = JSON.parse(localStorage.getItem(this.storageKey) || "[]");
          if (collection.some(i=>i.character_id===charData.character_id)) return resolve({code:400, message:"已经收藏过该单字"});
          const newItem = { character_id: charData.character_id, text: charData.text, work_id: charData.work_id, work_title: charData.work_title, work_style: charData.work_style, position: charData.position, imageData: charData.imageData, collected_at: charData.collected_at||new Date().toISOString(), has_annotation:false };
          collection.push(newItem);
          localStorage.setItem(this.storageKey, JSON.stringify(collection));
          resolve({ code:201, message:"添加成功", data:newItem });
        }, 200);
      });
    }
  }

  if (typeof window !== 'undefined') window.mockAPI = new MockAPI();
  else globalThis.mockAPI = new MockAPI();
})();