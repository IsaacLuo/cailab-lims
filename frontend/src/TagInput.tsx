import * as React from 'react'
import { Input, Tag, Button } from 'element-react'
import styled from 'styled-components'


const MyTag = styled(Tag)`
margin-right: 10px;
`;

interface IProps {
  tags?: string[],
  onChange?: (tags: string[]) => void
}

interface IState {
  newTagInputValue: string,
  newTagInputVisible: boolean,
}

class TagInput extends React.Component<IProps, IState> {
  public tagInputRef:React.RefObject<Input> = React.createRef()

  constructor(props:IProps) {
    super(props);
    this.state = {
      newTagInputValue: '',
      newTagInputVisible: false,
    }
  }  
  public render() {
    const {tags} = this.props;

    return (
      <div>
      { tags && 
        tags.map((tag, index) => {
          return (
            <MyTag
              key={index}
              closable={true}
              closeTransition={false}
              type="primary"
              onClose={this.onCloseTag.bind(this, index)}>{tag}</MyTag>
          )
        })
      }
      {
        this.state.newTagInputVisible ? (
          <Input
            style={{width: 100}}
            className="input-new-tag"
            value={this.state.newTagInputValue}
            ref={this.tagInputRef}
            size="small"
            onChange={this.onCreateNewTag}
            onKeyUp={this.onTagInputKeyUp}
            onBlur={this.handleTagInputConfirm}
          />
        ) : <Button 
        style={{width: 100}}
        className="button-new-tag" 
        size="small" 
        onClick={this.showInput}>+ New Tag</Button>
      }
      </div>
    )
  }

  private onCloseTag = index => {
    const {tags, onChange} = this.props;
    const newTags:string[] = tags ? [...tags] : [];
    newTags.splice(index,1)
    if (onChange) {
      onChange(newTags);
    }
  }

  private onCreateNewTag = value => {
    this.setState({newTagInputValue: value});
  }

  private onTagInputKeyUp = event => {
    if (event.keyCode === 13) {
      this.handleTagInputConfirm();
    }
  }

  private handleTagInputConfirm = () => {
    const { tags, onChange} = this.props;
    const { newTagInputValue } = this.state;

    const newTags = tags ? (newTagInputValue ? [...tags,newTagInputValue] : tags) : [];
  
    this.setState({
      newTagInputVisible: false,
      newTagInputValue: '',
    });
    if (onChange) {
      onChange(newTags);
    }
  }

  private showInput = () => {
    this.setState({newTagInputVisible: true}, () => {
      if( this.tagInputRef &&  this.tagInputRef.current) {
        // this.tagInputRef.current.focus();
      }
    });
  }
}

export default TagInput