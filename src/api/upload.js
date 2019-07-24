import request from '@/utils/request'

export function uploadFile(params, data) {
  return request({
    path: '/upload',
    method: 'post',
    params,
    data
  })
}
