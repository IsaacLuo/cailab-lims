import * as React from 'react'
import { Dialog, Input, DatePicker, Tag, Button } from 'element-react'
import styled from 'styled-components'
// redux
import { IStoreState } from './store'
import { Dispatch } from 'redux'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { ActionSetEditPartDialogVisible } from './actions'
import TagInput from './TagInput';




const Panel = styled.div`
margin: 50px;
// display: flex;
// flex-direction: column;
// align-items: center;
`;

const Row = styled.div`
width: 100%;
margin: 20px 0px;
display: flex;
align-items: center;
`;

const FormKey = styled.div`
flex: none;
width: 100px;
text-align: left;
`;

const FormValue = styled.div`
flex: auto;
`;

const MyTag = styled(Tag)`
margin-right: 10px;
`;

interface IProps {
  dialogVisible: boolean,
  partId: string,
  hideDialog: () => void
}

interface IState {
}

class EditPartDialog extends React.Component<IProps, IState> {
  public tagInputRef:React.RefObject<Input> = React.createRef()

  constructor(props:IProps) {
    super(props);
    this.state = {
    }
  }  
  public render() {
    return (
      <Dialog
              title="Edit Part"
              // size="large"
              visible={this.props.dialogVisible}
              lockScroll={ false }
              onCancel = {this.onCancel}
      >
        <Panel>
            <Row>
            <FormKey>
                name
            </FormKey>
            <FormValue>
                <Input/>
            </FormValue>
            </Row>
        </Panel>
      </Dialog>
    )
  }

  private onCancel = () => {
    this.props.hideDialog();
  }
}

const mapStateToProps = (state :IStoreState) => ({
  dialogVisible: state.editPartDialogVisible,
  partId: state.editPartDialogPartId,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  hideDialog: () => dispatch(ActionSetEditPartDialogVisible(false)),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(EditPartDialog))
