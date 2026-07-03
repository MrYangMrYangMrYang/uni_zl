<template>
	<PostForm mode="edit" :postid="postid" />
</template>

<script>
import PostForm from '@/components/PostForm.vue'

export default {
	components: { PostForm },

	data() {
		return {
			postid: 0
		}
	},

	onLoad(option) {
		this.postid = option.postid ? option.postid : 0
	}
}
</script>
