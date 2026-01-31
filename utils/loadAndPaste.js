const { getCurrentTime, isExpired } = require('./time')
const Paste = require('../model/paste.model')


// With increment: validate + fetch + increment - for /p/:id only
async function loadPasteAndIncrement(req) {
  const paste = await Paste.findById(req.params.id);
  if (!paste) return { error: { status: 404, msg: 'Paste not found' } };

  const currentTime = getCurrentTime(req);

  if (isExpired(paste, currentTime)) {
    return { error: { status: 404, msg: 'Paste expired' } };
  }

  // Check BEFORE increment
  if (paste.max_views && paste.view_count >= paste.max_views) {
    return { error: { status: 404, msg: 'View limit exceeded' } };
  }

  // Atomic increment and return updated doc
  const updated = await Paste.findByIdAndUpdate(
    paste._id,
    { $inc: { view_count: 1 } },
    { new: true }
  );

  return { paste: updated };
}


module.exports = { loadPasteAndIncrement }