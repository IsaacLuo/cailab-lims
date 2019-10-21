/**
 * Login Dialog
 */

// types
import { IStoreState, IComment, IUserInfo, IPart } from '../../types';

// react
import * as React from 'react'

// react-router-redux
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import styled from 'styled-components';
import { Input, Button } from 'element-react';
import {
  POST_NEW_COMMENT, SET_NEW_COMMENT_TEXT,
} from './actions';

const Author = styled.span`
  font-weight:bold;
  line-height:32px;
`
const Portrait = styled.img`
  border-radius: 32px;
  margin-right: 10px;
`

const DiscussionRow = styled.div`
  display:flex;
  align-items:center;
`

const PostTime = styled.span`
  color:#777777;
  font-size: 0.7em;
  margin-left:10px;
`

const CommentText = styled.div`
  word-break:break-all;
  text-align:left;
  margin-left: 42px;
  white-space: pre;
`

const CommentInputArea = styled.div`
  margin: 42px;
  text-align: right;
`

export interface IProps {
  comments: IComment[];
  part?: IPart;
  newCommentText: string;
  setNewCommentText: (data:string)=>void;
  postNewComment: (data:any)=>void;
}

interface IState {
  
}

const mapStateToProps = (state: IStoreState) => ({
  comments: state.discussion.comments,
  part:state.part.part,
  newCommentText: state.discussion.newCommentText,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  setNewCommentText: (data:string) => dispatch({type:SET_NEW_COMMENT_TEXT, data}),
  postNewComment: (data:any) => dispatch({type:POST_NEW_COMMENT, data})
})

class Discussion extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
  }

  public render() {
    if(this.props.part && this.props.part._id) {
    return <div>
      {
        this.props.comments.map((v,i)=>
        <div key={i}>
          <DiscussionRow>
            <Portrait src={`https://api.auth.cailab.org/api/user/${(v.author as IUserInfo)._id}/portrait/xs/profile.jpg`}/>
            <Author>{(v.author as IUserInfo).name}:</Author>
            <PostTime>{new Date(v.createdAt).toLocaleString()}</PostTime>
          </DiscussionRow>
          <CommentText>{v.text}</CommentText>
        </div>)
      }
      <CommentInputArea>
      <Input
        type="textarea"
        autosize={true}
        placeholder="new comment"
        value={this.props.newCommentText}
        onChange={this.onChangeCommentText}
      />
      <Button type="primary" onClick={this.submitComment}>submit</Button>
      </CommentInputArea>
    </div>
    } else {
      return <div>no comments</div>
    }
  }

  private onChangeCommentText = (newCommentText) => {
    this.props.setNewCommentText(newCommentText);
  }
  private submitComment = ()=>{
    const {newCommentText} = this.props;
    if(newCommentText){
      this.props.postNewComment({partId:this.props.part!._id!, text:newCommentText});
    }
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Discussion))
