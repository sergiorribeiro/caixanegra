module Caixanegra
  class Manager
    def handler(flow_definition = {})
      uid = SecureRandom.uuid.gsub("-", "")

      Caixanegra.redis.multi do |pipeline|
        pipeline.hset(:caixanegra, uid, JSON.dump(flow_definition))
        pipeline.expire(:caixanegra, 1.hour)
      end

      uid
    end

    def destroy
      Caixanegra.redis.hdel(:caixanegra, key)
    end

    def get(uid)
      value = Caixanegra.redis.hget(:caixanegra, uid)

      JSON.parse(value) if value.present?
    end
  end
end
