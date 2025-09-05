const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema(
  {
    note_content: { type: String, required: true },
    note_title: { type: String, required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', NoteSchema);


