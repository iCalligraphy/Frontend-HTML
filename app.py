from flask import Flask, jsonify, request, session, render_template
from datetime import datetime
# from flask_cors import CORS

app = Flask(__name__)
# CORS(app)
app.secret_key = "demo_secret_key"

# ==============================
# 模拟数据
# ==============================
USERS = [
    {"id": 1, "username": "xujie", "avatar": "/static/avatar1.png", "phone": "12345678901"},
    {"id": 2, "username": "test", "avatar": "/static/avatar2.png", "phone": ""}
]

WORKS = [
    {"id": 1, "name": "兰亭序", "author": "王羲之", "style": "行书", "likes": 12},
    {"id": 2, "name": "祭侄文稿", "author": "颜真卿", "style": "楷书", "likes": 8},
]

CHARACTERS = [
    {"id": 1, "char": "永", "style": "行书", "likes": 5},
    {"id": 2, "char": "和", "style": "行书", "likes": 3},
    {"id": 3, "char": "之", "style": "行书", "likes": 2},
]

COLLECTIONS = [
    {"id": 1, "name": "行书集", "user_id": 1, "characters": [1, 2]},
    {"id": 2, "name": "楷书集", "user_id": 1, "characters": [3]},
]

POSTS = [
    {"id": 1, "title": "书法分享", "content": "今天写了兰亭序...", "likes": 3, "comments": []},
]

DRAFTS = [
    {"id": 1, "title": "草稿1", "content": "未完成的作品", "user_id": 1}
]

REVIEWS = [
    {"id": 1, "work_id": 1, "status": "pending", "reviewer": None},
]

DAILY_CHECKIN = [
    {"user_id": 1, "date": "2025-12-02", "work_id": 1}
]

# ==============================
# 前端页面路由
# ==============================
@app.route('/')
def index():
    return render_template('index.html', active_page='index')


@app.route('/auth')
def auth():
    return render_template('auth.html', active_page='auth')


@app.route('/login')
def login_page():
    return render_template('auth.html', active_page='auth')



@app.route('/profile')
def profile():
    return render_template('profile.html', active_page='profile')


@app.route('/review-center')
def review_center():
    return render_template('review_center.html', active_page='review_center')


@app.route('/search')
def search_page():
    return render_template('search.html', active_page='search')


@app.route('/community')
def community():
    return render_template('community.html', active_page='community')


@app.route('/my-collections')
def my_collections():
    return render_template('my_collections.html', active_page='my_collections')


@app.route('/work_detail')
def work_detail_page():
    return render_template('work_detail.html', active_page='work_detail')


@app.route('/work-upload')
def work_upload():
    return render_template('work_upload.html', active_page='work_upload')


@app.route('/read-post')
def read_post():
    return render_template('read_post.html', active_page='read_post')



# ==============================
# 用户相关
# ==============================
@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    user = next((u for u in USERS if u["username"] == username), None)
    if user:
        session["user_id"] = user["id"]
        return jsonify({"code": 0, "msg": "登录成功", "user": user})
    return jsonify({"code": 1, "msg": "用户不存在"}), 401

@app.route("/api/register", methods=["POST"])
def register():
    data = request.json
    user_id = len(USERS) + 1
    USERS.append({"id": user_id, "username": data.get("username"), "avatar": "/static/avatar_default.png", "phone": ""})
    return jsonify({"code": 0, "msg": "注册成功", "user_id": user_id})

@app.route("/api/logout", methods=["POST"])
def logout():
    session.pop("user_id", None)
    return jsonify({"code": 0, "msg": "已退出"})

@app.route("/api/user/info", methods=["GET"])
def user_info():
    user_id = session.get("user_id", 1)
    user = next((u for u in USERS if u["id"] == user_id), None)
    return jsonify(user)

@app.route("/api/user/avatar", methods=["POST"])
def upload_avatar():
    return jsonify({"code": 0, "msg": "上传成功", "avatar": "/static/avatar1_new.png"})

@app.route("/api/user/password", methods=["POST"])
def change_password():
    return jsonify({"code": 0, "msg": "修改成功"})

@app.route("/api/user/phone", methods=["POST"])
def bind_phone():
    return jsonify({"code": 0, "msg": "绑定成功"})

# ==============================
# 作品相关
# ==============================
@app.route("/api/works", methods=["GET"])
def get_works():
    return jsonify(WORKS)

@app.route("/api/works/<int:work_id>", methods=["GET"])
def work_detail_api(work_id):
    work = next((w for w in WORKS if w["id"] == work_id), {})
    return jsonify(work)

@app.route("/api/works/<int:work_id>/characters", methods=["GET"])
def work_characters(work_id):
    return jsonify([c for c in CHARACTERS if c["id"] in [1,2,3]])

@app.route("/api/works/upload", methods=["POST"])
def upload_work():
    return jsonify({"code": 0, "msg": "上传成功", "work_id": len(WORKS)+1})

@app.route("/api/works/<int:work_id>/update", methods=["POST"])
def update_work(work_id):
    return jsonify({"code": 0, "msg": "更新成功"})

@app.route("/api/works/<int:work_id>/submit", methods=["POST"])
def submit_work(work_id):
    return jsonify({"code": 0, "msg": "提交审核成功"})

@app.route("/api/works/<int:work_id>", methods=["DELETE"])
def delete_work(work_id):
    return jsonify({"code": 0, "msg": "删除成功"})

# ==============================
# 单字相关
# ==============================
@app.route("/api/characters/<int:character_id>", methods=["GET"])
def character_detail(character_id):
    char = next((c for c in CHARACTERS if c["id"] == character_id), {})
    return jsonify(char)

@app.route("/api/characters/<int:character_id>/like", methods=["POST"])
def like_character(character_id):
    return jsonify({"code": 0, "msg": "点赞成功"})

# ==============================
# 字集相关
# ==============================
@app.route("/api/collections", methods=["GET"])
def get_collections():
    user_id = session.get("user_id", 1)
    return jsonify([c for c in COLLECTIONS if c["user_id"] == user_id])

@app.route("/api/collections", methods=["POST"])
def create_collection():
    return jsonify({"code": 0, "msg": "创建成功", "collection_id": len(COLLECTIONS)+1})

@app.route("/api/collections/<int:collection_id>", methods=["PUT"])
def update_collection(collection_id):
    return jsonify({"code": 0, "msg": "更新成功"})

@app.route("/api/collections/<int:collection_id>", methods=["DELETE"])
def delete_collection(collection_id):
    return jsonify({"code": 0, "msg": "删除成功"})

@app.route("/api/collections/<int:collection_id>/characters", methods=["GET"])
def collection_characters(collection_id):
    col = next((c for c in COLLECTIONS if c["id"] == collection_id), {})
    return jsonify([c for c in CHARACTERS if c["id"] in col.get("characters", [])])

@app.route("/api/collections/<int:collection_id>/add", methods=["POST"])
def add_to_collection(collection_id):
    return jsonify({"code": 0, "msg": "添加成功"})

@app.route("/api/collections/<int:collection_id>/remove", methods=["POST"])
def remove_from_collection(collection_id):
    return jsonify({"code": 0, "msg": "移除成功"})

@app.route("/api/collections/<int:collection_id>/move", methods=["POST"])
def move_character(collection_id):
    return jsonify({"code": 0, "msg": "移动成功"})

# ==============================
# 检索相关
# ==============================
@app.route("/api/search", methods=["GET"])
def search():
    q = request.args.get("q", "")
    result = [w for w in WORKS if q in w["name"]]
    return jsonify(result)

@app.route("/api/search/works", methods=["GET"])
def search_works():
    return jsonify(WORKS)

@app.route("/api/search/characters", methods=["GET"])
def search_characters():
    return jsonify(CHARACTERS)

# ==============================
# 草稿相关
# ==============================
@app.route("/api/drafts", methods=["GET"])
def get_drafts():
    user_id = session.get("user_id", 1)
    return jsonify([d for d in DRAFTS if d["user_id"] == user_id])

@app.route("/api/drafts", methods=["POST"])
def save_draft():
    return jsonify({"code": 0, "msg": "保存成功"})

@app.route("/api/drafts/<int:draft_id>", methods=["PUT"])
def update_draft(draft_id):
    return jsonify({"code": 0, "msg": "更新成功"})

@app.route("/api/drafts/<int:draft_id>", methods=["DELETE"])
def delete_draft(draft_id):
    return jsonify({"code": 0, "msg": "删除成功"})

# ==============================
# 审核相关
# ==============================
@app.route("/api/reviews", methods=["GET"])
def get_reviews():
    return jsonify(REVIEWS)

@app.route("/api/reviews/<int:review_id>", methods=["GET"])
def review_detail(review_id):
    return jsonify(next((r for r in REVIEWS if r["id"]==review_id), {}))

# ==============================
# 审核中心相关
# ==============================
@app.route("/api/admin/reviews", methods=["GET"])
def admin_reviews():
    return jsonify(REVIEWS)

@app.route("/api/admin/reviews/<int:work_id>", methods=["GET"])
def admin_review_detail(work_id):
    return jsonify(next((r for r in REVIEWS if r["work_id"]==work_id), {}))

@app.route("/api/admin/reviews/<int:work_id>/auto_screen", methods=["POST"])
def auto_screen(work_id):
    return jsonify({"code": 0, "msg": "自动初筛完成"})

@app.route("/api/admin/reviews/<int:work_id>/approve", methods=["POST"])
def approve(work_id):
    return jsonify({"code": 0, "msg": "审核通过"})

@app.route("/api/admin/reviews/<int:work_id>/reject", methods=["POST"])
def reject(work_id):
    return jsonify({"code": 0, "msg": "审核驳回"})

# ==============================
# 个人中心相关
# ==============================
@app.route("/api/user/works", methods=["GET"])
def my_works():
    user_id = session.get("user_id", 1)
    return jsonify([w for w in WORKS if user_id==1])

@app.route("/api/user/likes", methods=["GET"])
def my_likes():
    return jsonify(CHARACTERS)

@app.route("/api/user/history", methods=["GET"])
def my_history():
    return jsonify(CHARACTERS)

@app.route("/api/user/settings", methods=["POST"])
def user_settings():
    return jsonify({"code": 0, "msg": "更新成功"})

# ==============================
# 社区论坛相关
# ==============================
@app.route("/api/posts", methods=["GET"])
def get_posts():
    return jsonify(POSTS)

@app.route("/api/posts", methods=["POST"])
def create_post():
    return jsonify({"code":0,"msg":"发帖成功","post_id":len(POSTS)+1})

@app.route("/api/posts/<int:post_id>", methods=["GET"])
def post_detail(post_id):
    return jsonify(next((p for p in POSTS if p["id"]==post_id), {}))

@app.route("/api/posts/<int:post_id>/comment", methods=["POST"])
def post_comment(post_id):
    return jsonify({"code":0,"msg":"评论成功"})

@app.route("/api/posts/<int:post_id>/like", methods=["POST"])
def post_like(post_id):
    return jsonify({"code":0,"msg":"点赞成功"})

@app.route("/api/daily_checkin", methods=["GET"])
def get_checkin():
    user_id = session.get("user_id", 1)
    return jsonify([d for d in DAILY_CHECKIN if d["user_id"]==user_id])

@app.route("/api/daily_checkin", methods=["POST"])
def post_checkin():
    return jsonify({"code":0,"msg":"打卡成功"})

# ==============================
# 启动
# ==============================
if __name__ == "__main__":
    app.run(debug=True)
