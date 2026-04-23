from pymongo import MongoClient
from datetime import datetime, timedelta
from bson import ObjectId

MONGO_URI = "mongodb+srv://SmartCart:aayush182005@cluster0.n7rlxnr.mongodb.net/smartcart?retryWrites=true&w=majority&appName=Cluster0"

client = MongoClient(MONGO_URI)
db = client["smartcart"]

def predict_refill(user_id):
    try:
        query_id = ObjectId(user_id)
    except Exception:
        query_id = user_id
        
    orders = list(db.orders.find({"userId": query_id}))

    if not orders:
        return []

    product_data = {}

    for order in orders:
        order_date = order["orderDate"]
        for item in order["items"]:
            pid = str(item["productId"])
            qty = item["quantity"]

            if pid not in product_data:
                product_data[pid] = {
                    "totalQuantity": 0,
                    "firstDate": order_date,
                    "lastDate": order_date,
                    "lastQuantity": qty
                }

            product_data[pid]["totalQuantity"] += qty

            if order_date > product_data[pid]["lastDate"]:
                product_data[pid]["lastDate"] = order_date
                product_data[pid]["lastQuantity"] = qty

            if order_date < product_data[pid]["firstDate"]:
                product_data[pid]["firstDate"] = order_date

    predictions = []

    for pid, data in product_data.items():
        first = data["firstDate"]
        last = data["lastDate"]
        total_qty = data["totalQuantity"]

        days_diff = (last - first).days

        if days_diff == 0:
            days_diff = 1

        daily_consumption = total_qty / days_diff

        if daily_consumption == 0:
            continue

        days_until_refill = data["lastQuantity"] / daily_consumption
        predicted_date = last + timedelta(days=days_until_refill)

        product = db.products.find_one({"_id": ObjectId(pid)})
        product_name = product["name"] if product else "Unknown"

        predictions.append({
            "productId": pid,
            "productName": product_name,
            "dailyConsumption": round(daily_consumption, 3),
            "predictedRefillDate": predicted_date.strftime("%Y-%m-%d"),
            "daysUntilRefill": round(days_until_refill)
        })

    predictions.sort(key=lambda x: x["daysUntilRefill"])

    return predictions