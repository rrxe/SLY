export default function handler(req, res) {
  // للتحقق من أن الطلب من نوع POST
  if (req.method === 'POST') {
    // هنا سنضع لاحقاً كود حفظ البيانات في قاعدة البيانات
    return res.status(200).json({ 
      message: 'تم استلام طلب التحقق بنجاح!', 
      coinsAdded: 10 
    });
  } else {
    // إذا حاول أحد فتح الرابط مباشرة
    return res.status(405).json({ message: 'هذا الرابط مخصص لطلبات اللعبة فقط' });
  }
}
