import * as React from 'react'
import { Dialog } from 'element-react'

// redux
import { IStoreState } from './store'
import { Dispatch } from 'redux'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { ActionSetNewPartDialogVisible } from './actions'

interface IProps {
  hideDialog: () => void
}

interface IState {

}

class NewPartDialog extends React.Component<IProps, IState> {  
  public render() {
    return (
      <Dialog
              title="Login"
              size="large"
              visible={true}
              lockScroll={ false }
              onCancel = {this.onCancel}
      >
        <div>test</div>
      </Dialog>
    )
  }

  private onCancel = () => {
    this.props.hideDialog();
  }

}

const mapStateToProps = (state :IStoreState) => ({

})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  hideDialog: () => dispatch(ActionSetNewPartDialogVisible(false)),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(NewPartDialog))
