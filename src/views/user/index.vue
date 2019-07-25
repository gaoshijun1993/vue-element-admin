<template>
  <div class="app-container users">
    <el-button type="primary" class="new-button" @click="handleNew">New User</el-button>
    <el-table :data="users.items">
      <el-table-column v-for="column in columns" :key="column.prop" :label="column.label ? column.label : column.prop" :data="users">
        <template slot-scope="scope">
          <v-node
            v-if="column.render"
            :node="column.render($createElement, scope.row)"
          />
          <span v-else>{{ scope.row[column.prop] }}</span>
        </template>
      </el-table-column>
      <el-table-column>
        <template slot-scope="scope">
          <el-button type="warning" size="small" @click="handleEdit(scope.row)">Edit</el-button>
          <el-button type="danger" size="small" @click="handleDelete(scope.row)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      :current-page.sync="query.pageNum"
      :page-size.sync="query.pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :page-sizes="[20, 30, 40]"
      :total="users.total"
    />

    <el-dialog :visible.sync="dialogVisible" :title="formMode">
      <el-form v-if="dialogVisible" ref="form" :model="userModel">
        <el-form-item prop="username" label="username">
          <el-input v-model="userModel.username" autocomplete="off" />
        </el-form-item>
        <el-form-item v-if="formMode==='new'" prop="password" label="password">
          <el-input v-model="userModel.password" type="password" auto-complete="off" />
        </el-form-item>
        <el-form-item prop="email" label="email">
          <el-input v-model="userModel.email">{{ userModel.email }}</el-input>
        </el-form-item>
        <el-form-item prop="avatar" label="avatar">
          <img v-if="userModel.avatar" :src="userModel.avatar">
          <el-button type="primary" @click="handleUploadAvatar">upload</el-button>
        </el-form-item>
        <el-form-item prop="roles" label="roles">
          <el-select :value="userModel.roles.map(el => el.id)" multiple placeholder="Please select user roles" @change="handleRoleSelect">
            <el-option
              v-for="item in roleOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleCancel">取 消</el-button>
        <el-button type="primary" @click="handleConfirm">确 定</el-button>
      </div>
    </el-dialog>

    <image-cropper
      v-show="imagecropperShow"
      :key="imagecropperKey"
      field="file"
      :width="300"
      :height="300"
      url="/upload"
      lang-type="en"
      @close="close"
      @crop-upload-success="cropSuccess"
    />
  </div>
</template>

<script>
import { createUser, fetchUsers, deleteUser, updateUser } from '@/api/user'
import { getRoles } from '@/api/role'
import VNode from '@/components/VNode'
import ImageCropper from '@/components/ImageCropper'
export default {
  name: 'User',
  components: {
    VNode,
    ImageCropper
  },
  data() {
    return {
      imagecropperShow: false,
      imagecropperKey: 1,
      formMode: 'new',
      columns: [
        {
          prop: 'username'
        },
        {
          prop: 'email'
        },
        {
          prop: 'avatar',
          render(h, row) {
            return row.avatar ? <img class='avatar' src={row.avatar}/> : <span/>
          }
        },
        {
          prop: 'roles',
          render(h, row) {
            const items = row.roles.map(role => {
              return <el-tag>{role.name}</el-tag>
            })
            return <div>{items}</div>
          }
        }
      ],
      query: {
        pageNum: 1,
        pageSize: 20
      },
      users: {
        total: 0,
        items: []
      },
      roleOptions: [],
      userModel: {
        name: '',
        email: '',
        avatar: '',
        password: '',
        roles: []
      },
      dialogVisible: false
    }
  },
  watch: {
    query: {
      deep: true,
      immediate: true,
      handler() {
        this.getUsers()
      }
    }
  },
  created() {
    this.getRolesData()
  },
  methods: {
    render(h, val) {
      return <h1>{{ val }}</h1>
    },
    async getUsers() {
      const { data } = await fetchUsers(this.query)
      const { total, items } = data
      this.users.total = total
      this.users.items = items
    },
    async getRolesData() {
      const { data } = await getRoles()
      this.roleOptions = data
    },
    handleRoleSelect(roles) {
      this.userModel.roles = roles.map(id => {
        return this.roleOptions.find(item => item.id === id)
      })
    },
    handleNew() {
      this.formMode = 'new'
      this.userModel = {
        name: '',
        email: '',
        avatar: '',
        password: '',
        roles: []
      }
      this.dialogVisible = true
    },
    handleEdit(row) {
      this.formMode = 'edit'
      this.userModel = row
      this.dialogVisible = true
    },
    handleDelete(row) {
      this.$confirm('Confirm delete user?', 'Warning', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return deleteUser(row.id)
      }).then(() => {
        this.users.items = this.users.items.filter(user => user.id !== row.id)
        this.$message({
          type: 'success',
          message: 'Delete Success!'
        })
      }).catch(err => {
        if (err === 'cancel') return
        this.$message({
          type: 'danger',
          message: 'Delete Failed'
        })
      })
    },
    handleCancel() {
      this.$refs.form.resetFields()
      this.dialogVisible = false
    },
    async handleConfirm() {
      if (this.formMode === 'new') {
        const { data } = await createUser(this.userModel)
        this.users.items.push(Object.assign(this.userModel, { id: data.id }))
        this.$message({
          type: 'success',
          message: 'Create Success'
        })
        this.dialogVisible = false
      } else {
        await updateUser(this.userModel.id, this.userModel)
        this.$message({
          type: 'success',
          message: 'Update Success'
        })
        this.dialogVisible = false
      }
    },
    handleUploadAvatar() {
      this.imagecropperShow = true
    },
    cropSuccess(resData) {
      this.imagecropperShow = false
      this.imagecropperKey = this.imagecropperKey + 1
      debugger
      this.image = resData.files.avatar
    },
    close() {
      this.imagecropperShow = false
    }
  }
}
</script>
<style lang="scss" scoped>
.new-button {
  margin: 20px 0 20px 0;
}
.avatar {
  width: 30px;
  height: 30px;
}
</style>

