from pymongo import MongoClient
from collections import defaultdict
from bson import ObjectId

MONGO_URI = "mongodb+srv://SmartCart:aayush182005@cluster0.n7rlxnr.mongodb.net/smartcart?retryWrites=true&w=majority&appName=Cluster0"

client = MongoClient(MONGO_URI)
db = client["smartcart"]

def get_recommendations(user_id):
    user_orders = list(db.orders.find({"userId": user_id}))
    user_products = set()

    for order in user_orders:
        for item in order["items"]:
            user_products.add(str(item["productId"]))

    if not user_products:
        return []

    all_orders = list(db.orders.find({"userId": {"$ne": user_id}}))

    product_frequency = defaultdict(int)

    for order in all_orders:
        order_products = [str(item["productId"]) for item in order["items"]]

        if any(p in user_products for p in order_products):
            for p in order_products:
                if p not in user_products:
                    product_frequency[p] += 1

    sorted_products = sorted(product_frequency.items(),
                             key=lambda x: x[1], reverse=True)

    recommendations = []

    for pid, freq in sorted_products[:5]:
        product = db.products.find_one({"_id": ObjectId(pid)})
        if product:
            recommendations.append({
                "productId": pid,
                "productName": product["name"],
                "category": product["category"],
                "price": product["price"],
                "unit": product["unit"],
                "score": freq
            })

    return recommendations