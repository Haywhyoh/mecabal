import { PostComment } from '../post-comment.entity';
import { CommentMedia } from '../comment-media.entity';

describe('Entity Relationship Tests', () => {
  it('should create PostComment without circular dependency', () => {
    const comment = new PostComment();
    comment.id = 'test-comment-id';
    comment.postId = 'test-post-id';
    comment.userId = 'test-user-id';
    comment.content = 'Test comment';
    
    expect(comment).toBeDefined();
    expect(comment.id).toBe('test-comment-id');
  });

  it('should create CommentMedia with reference to PostComment', () => {
    const media = new CommentMedia();
    media.id = 'test-media-id';
    media.commentId = 'test-comment-id';
    media.mediaType = 'image';
    media.fileUrl = 'https://example.com/image.jpg';
    
    expect(media).toBeDefined();
    expect(media.commentId).toBe('test-comment-id');
  });

  it('should not have circular import issues', () => {
    expect(() => {
      const comment = new PostComment();
      const media = new CommentMedia();
    }).not.toThrow();
  });
});
