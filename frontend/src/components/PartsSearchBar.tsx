import * as React from 'react';
import { Input } from 'element-react';

interface IProps {
  text?: string,
  onSearch?: (searchKey: string) => void,
}
interface IState {
  searchKey: string,
}

class PartsSearchBar extends React.Component<IProps, IState> {
  constructor (props:IProps) {
    super(props);
    this.state = {
      searchKey: props.text || '',
    }
  }

  public componentWillReceiveProps(np: IProps) {
    if(np.text !== this.props.text) {
      this.setState({searchKey: np.text || ''});
    }
  }

  public render() {
    return (
      <Input
        value={this.state.searchKey}
        onChange={this.onSearchInputChange}
        onKeyUp={this.onSearchInputKeyUp}
      />
    )
  }

  private onSearchInputChange = searchKey => {
    this.setState({searchKey});
  }

  private onSearchInputKeyUp = event => {
    if (event.keyCode === 13) {
      if (this.props.onSearch) {
        this.props.onSearch(this.state.searchKey);
      }
    }
  };

}

export default PartsSearchBar;