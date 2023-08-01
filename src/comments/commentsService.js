const { Comment, Post } = require('../../model/');

const getComment = async (id) => {
  const comment = await Comment.findById(id);

  return comment;
};

const getComments = async (postId) => {
  const comments = await Comment.find({
    post: postId,
  });

  return comments;
};

const createComment = async (comment) => {
  const newComment = await Comment.create(comment);
  newComment.post = comment.post;

  const post = await Post.findById({ _id: comment.post });
  post.comments = post.comments.concat(newComment._id);

  await post.save();
  await newComment.save();

  return newComment;
};

const updateComment = async (id, { content }) => {
  const updatedComment = await Comment.findByIdAndUpdate(
    id,
    { content },
    {
      new: true,
      runValidators: true,
      context: 'query',
    }
  );

  return updatedComment;
};

const upvoteComment = async ({ id, userId }) => {
  const comment = await Comment.findById(id);
  if (!comment) {
    return false;
  }

  if (comment.upvotedBy.includes(userId)) {
    comment.upvotes--;
    const searchIndex = comment.upvotedBy.indexOf(userId);
    comment.upvotedBy.splice(searchIndex, 1);

    await comment.save();

    return comment;
  }

  if (comment.downvotedBy.includes(userId)) {
    comment.downvotes--;
    const searchIndex = comment.downvotedBy.indexOf(userId);
    comment.downvotedBy.splice(searchIndex, 1);
  }

  comment.upvotes++;
  comment.upvotedBy.push(userId);
  await comment.save();

  return comment;
};

const downvoteComment = async ({ id, userId }) => {
  const comment = await Comment.findById(id);
  if (!comment) {
    return false;
  }

  if (comment.downvotedBy.includes(userId)) {
    comment.downvotes--;
    const searchIndex = comment.downvotedBy.indexOf(userId);
    comment.downvotedBy.splice(searchIndex, 1);

    await comment.save();

    return comment;
  }

  if (comment.upvotedBy.includes(userId)) {
    comment.upvotes--;
    const searchIndex = comment.upvotedBy.indexOf(userId);
    comment.upvotedBy.splice(searchIndex, 1);
  }

  comment.downvotes++;
  comment.downvotedBy.push(userId);
  await comment.save();

  return comment;
};

const isCommentAuthor = async ({ userId, commentId }) => {
  const { author } = await Comment.findById(commentId);
  return userId.toString() === author._id.toString();
};

module.exports = {
  getComment,
  getComments,
  createComment,
  updateComment,
  upvoteComment,
  downvoteComment,
  isCommentAuthor,
};
