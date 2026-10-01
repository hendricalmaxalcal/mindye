import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  runTransaction,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const productsRef = collection(db, "products");

function cleanBarcode(value) {
  const barcode = String(value || "").trim();
  if (!barcode) throw new Error("Barcode is required.");
  if (barcode.includes("/")) throw new Error("Barcode cannot contain '/'.");
  return barcode;
}

// Find one product by scanned barcode. Returns null if it doesn't exist.
export async function getProductByBarcode(barcode) {
  const snap = await getDoc(doc(db, "products", cleanBarcode(barcode)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// All products, sorted by name.
export async function listProducts() {
  const snap = await getDocs(query(productsRef, orderBy("name")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Create a product. The barcode is used as the document ID.
export async function addProduct(product) {
  const barcode = cleanBarcode(product.barcode);
  const name = String(product.name || "").trim();
  const price = Number(product.price);

  if (!name) throw new Error("Product name is required.");
  if (Number.isNaN(price) || price < 0) throw new Error("Enter a valid price.");

  const ref = doc(db, "products", barcode);
  if ((await getDoc(ref)).exists()) {
    throw new Error("A product with this barcode already exists.");
  }

  await setDoc(ref, {
    name,
    price,
    costPrice: Number(product.costPrice) || 0,
    stock: Number(product.stock) || 0, // opening stock only
    category: String(product.category || "").trim(),
    lowStockLevel: Number(product.lowStockLevel) || 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// Edit product details. Stock is deliberately NOT editable here.
export async function updateProduct(barcode, changes) {
  const name = String(changes.name || "").trim();
  const price = Number(changes.price);

  if (!name) throw new Error("Product name is required.");
  if (Number.isNaN(price) || price < 0) throw new Error("Enter a valid price.");

  await updateDoc(doc(db, "products", cleanBarcode(barcode)), {
    name,
    price,
    costPrice: Number(changes.costPrice) || 0,
    category: String(changes.category || "").trim(),
    lowStockLevel: Number(changes.lowStockLevel) || 0,
    updatedAt: serverTimestamp(),
  });
}

// Delete a product that is no longer sold. Only allowed when its stock is 0.
export async function deleteProduct(barcode) {
  const ref = doc(db, "products", cleanBarcode(barcode));

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      throw new Error("This product no longer exists.");
    }
    const stock = Number(snap.data().stock) || 0;
    if (stock !== 0) {
      throw new Error(
        `Stock must be 0 before a product can be deleted (currently ${stock}).`
      );
    }
    tx.delete(ref);
  });
}